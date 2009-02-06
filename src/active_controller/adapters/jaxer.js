/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2009 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * ***** END LICENSE BLOCK ***** */
 
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
    }
};

ActiveController.Server.IO = {
    exists: function exists(path)
    {
        return Jaxer.File.exists(file);
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
        
    }
};