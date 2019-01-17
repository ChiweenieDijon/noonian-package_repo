function (db, _, queryParams) {
    const semver = require('semver');
    
    var keys = {}; 
    var versions = {};
    
    var keysParam;
    if(queryParams.keys) {
        try {
            keysParam = JSON.parse(queryParams.keys);
        }
        catch(err) {
            keysParam  = queryParams.keys;
        }
    }
    
    if(keysParam instanceof Array) {
        //Passed an array of keys -> grab latest version of each one
        _.forEach(keysParam, k=>{keys[k]=true;});
    }
    else if(typeof keysParam === 'object') {
        //Passed an object whose keys are pkg keys, values are pkg versions
        keys = keysParam;
    }
    else if(typeof keysParam === 'string') {
        //Passed a single pkg key -> grab latest version of it
        keys[keysParam] = true;
    }
    
    const normalizeVersionStr = function(v) {
        if(v.split('.').length < 3) {
            v = v+'.0';
        }
        return v;
    }
    
    const queryObj = {};
    const keysArr = Object.keys(keys);
    if(keysArr.length) queryObj.package_key = {$in:keysArr};
    
    return db.HostedPackage.find(queryObj).then(function(hpList) {
        if(!keysArr.length) {
            //Default to grab latest version of all packages
            _.forEach(hpList, hp=>{keys[hp.package_key] = true});
        }
        console.log('Retrieving metadata for %j', keys);
        var result = [];
        _.forEach(hpList, function(hp) {
            let askingFor;
            if(askingFor = keys[hp.package_key]) {
                var versions = hp.available_versions;
                if(typeof askingFor === 'boolean') {
                    askingFor = versions[versions.length-1];
                }
                
                askingFor = normalizeVersionStr(askingFor);
                
                let md = hp.package_metadata[askingFor];
                
                if(!md) {
                    for(let i=versions.length-1; i >=0; i--) {
                        let toTry = normalizeVersionStr(versions[i]);
                        // console.log('satisfies(%s, %s)', toTry, askingFor);
                        if(semver.satisfies(toTry, askingFor)) {
                            md = hp.package_metadata[toTry];
                            if(md) break;
                        }
                    }
                }
                
                md && result.push(md);
            }
        });
        return result;
    });
}