function (db, postBody, httpRequestLib, Q, _) {
    const GridFsService = db._svc.GridFsService;
    const repoName = postBody && postBody.repository && postBody.repository.name;
    
    if(!repoName) {
        console.error('githubTarget called with bad post: %j', postBody);
        return 'invalid post body';
    }
    
    
    return db.HostedPackage.findOne({'git_config.repository_name':repoName}).then(function(hp) {
        if(!hp) {
            console.error('githubTarget called with bad repo name: %s \n %j', repoName, postBody);
            return 'Repository '+repoName+' not configured properly';
        }
        
        console.log('Hosted Package: %j', hp);
        var cfg = hp.git_config;
        
        var interestedBranch = 'refs/heads/'+cfg.trigger_branch;
        
        if(interestedBranch !== postBody.ref) {
            return `Not interested in branch ${postBody.ref}`;
        }
        
        //We're interested! Check pkg version...
        var deferred = Q.defer();
        
        var url= postBody.repository.contents_url;
        
        if(!url) {
            return "Bad contents_url";
        }
        url = url.replace('{+path}', cfg.dist_path);
        
        var header = {
            Authorization:'token '+cfg.api_access_token,
            'User-Agent':'Noonian-integration-'+cfg.api_user_agent
        };
        
        httpRequestLib.get({
            uri:url,
            headers:header,
            json:true
        },
        function(err,httpResponse, body) {
            console.log(err, body);
            if(err || !body || !body.length) {
                var msg = err || 'Missing body';
                console.error(msg);
                return deferred.reject(msg);
            }
            
            
            const myVersions = hp.available_versions || [];
            const toPull = [];
            const regex = new RegExp(hp.package_key+'.([\\d\\.]+).json')
            for(var file of body) {
                let match = regex.exec(file.name);
                let ver = match && match[1];
                if(ver && myVersions.indexOf(ver) < 0) {
                    toPull.push({
                        ver,
                        url:file.download_url,
                        metaObj:{
                            filename:hp.package_key+'.'+ver+'.json',
                            size:file.size,
                            type:'application/json'
                        }
                    });
                }
            }
            
            var dlPromises = [];
            _.forEach(toPull, function(pullFile) {
                var {ver, url, metaObj} = pullFile;
            
                console.log('Pulling '+url);
                var respStream = httpRequestLib.get({uri:url,headers:header});
                
                dlPromises.push(
                    GridFsService.saveFile(respStream, metaObj).then(function(fileId) {
                        console.log('SAVED FILE');
                        //file has been saved to gridfs
                        metaObj.attachment_id = fileId;
                        hp.available_versions = hp.available_versions || [];
                        hp.available_versions.push(ver);
                        
                        hp.package_files = hp.package_files || [];
                        hp.package_files.push(metaObj);
                        hp.markModified('available_versions');
                        hp.markModified('package_files');
                    })
                );
            });
            
            Q.all(dlPromises).then(function() {
                console.log('SAVING HP');
                deferred.resolve(toPull);
                return hp.save();
            },
            function(err) {
                console.error(err);
            });
            
            
        });
        
        
        return deferred.promise;
        
    });
}