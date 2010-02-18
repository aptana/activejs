ActiveController.Server.Response = {
    setStatus: function setStatus(status_code,reason_phrase)
    {
        Jaxer.response.statusCode = status_code;
        if(reason_phrase)
        {
            Jaxer.response.reasonPhrase = reason_phrase;
        }
    },
    setContents: function setContents(contents)
    {
        Jaxer.response.setContents(contents);
    },
    setHeader: function addHeader(key,value)
    {
        Jaxer.response.headers[key] = value;
    },
    getHeader: function getHeader(key,value)
    {
        return Jaxer.response.headers[key];
    },
    removeHeader: function removeHeader(key)
    {
        Jaxer.response.headers[key];
    },
    redirect: function redirect(url,status_code,reason_phrase)
    {
        if(status_code)
        {
            Jaxer.response.setStatus(status_code,reason_phrase);
        }
        Jaxer.response.redirect(url);
        Jaxer.response.exit();
    }
};

ActiveController.Server.Request = {
    getData: function getData()
    {
        return Jaxer.request.data;
    },
    getQuery: function getQuery()
    {
        return Jaxer.request.parsedUrl.queryParts;
    },
    getMethod: function getMethod()
    {
        return (Jaxer.request.data._method ? Jaxer.request.data._method : Jaxer.request.action).toLowerCase();
    },
    getURI: function getURI()
    {
        return Jaxer.request.uri;
    },
    getExtension: function getExtension()
    {
        return (Jaxer.request.uri.split('.').pop() || '').replace(/\?.*$/,'').replace(/\#.*$/,'');
    }
};

ActiveController.Server.IO = {
    exists: function exists(path)
    {
        return Jaxer.File.exists(path);
    },
    load: function load(path)
    {
        return Jaxer.load('file://' + path,null,'server');
    },
    read: function read(path)
    {
        return Jaxer.File.read(path);
    },
    grep: function grep(path,pattern,recursive)
    {
        return Jaxer.Dir.grep(path,{
            pattern: pattern,
            recursive: typeof(recursive) == 'undefined' ? true : recursive
        });
    }
};

ActiveController.Server.Environment = {
    isProduction: function isProduction()
    {
        return Jaxer.Config.DEV_MODE;
    },
    getApplicationRoot: function getApplicationRoot()
    {
        return Application.Config.root + 'app'
    }
};