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

ActiveController.Errors.FileDoesNotExist = 'Could not find the file to render: ';

ActiveController.Server = {};

ActiveController.Server.Response = {
    setStatus: function setStatus(status_code,reason_phrase){},
    setContents: function setContents(contents){},
    setHeader: function addHeader(key,value){},
    getHeader: function getHeader(key,value){},
    removeHeader: function removeHeader(key){},
    redirect: function redirect(url,status_code,reason_phrase){}
};

ActiveController.Server.Request = {
    getData: function getData(){},
    getQuery: function getQuery(){},
    getMethod: function getMethod(){},
    getURI: function getURI(){},
    getExtension: function getExtension(){}
};

ActiveController.Server.IO = {
    exists: function exists(path){},
    load: function load(path){},
    read: function read(path){},
    grep: function grep(path,pattern,recursive){}
};

ActiveController.Server.Environment = {
    isProduction: function isProduction(){},
    getApplicationRoot: function getApplicationRoot(){}
};

ActiveController.Server.parseParams = function parseParams(params)
{
    var result = {};
    
    for (var p in params)
    {
        // convert format for easier splitting
        var dotted_name = p.replace(/\[[^\]]+\]/g, function(a) { return "." + a.substring(1, a.length - 1)});
        
        // split into steps
        var parts = dotted_name.split(".");
        
        if (parts.length == 1)
        {
            // no index, so use the property value directly
            result[p] = params[p];
        }
        else
        {
            // we have indexes, so process each step
            var current_object = result;
            var next_part = parts[0];
            
            for (var i = 1; i < parts.length; i++)
            {
                // update current part that we're processing now
                var current_part = next_part;
                
                // look ahead to next part - needed to determine the type of composite to use for current_part
                next_part = parts[i];
                
                if (current_object.hasOwnProperty(current_part) == false)
                {
                    if (next_part.match(/^(?:[0-9]|[1-9][0-9]+)$/))
                    {
                        // process as array
                        current_object[current_part] = [];
                    }
                    else
                    {
                        // process as object
                        current_object[current_part] = {};
                    }
                }
                // NOTE: may want else-clause to verify we don't have
                // conflicting index types (name and number on same object)
                
                // update the current object based on the current part
                current_object = current_object[current_part];
            }
            
            // assign value onto current object using last part
            current_object[parts[parts.length - 1]] = params[p];
        }
    }
    return result;
};

ActiveController.Server.StatusCodes = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",

    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    226: "IM Used",
    
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    426: "Upgrade Required",
    
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    507: "Insufficient Storage",
    510: "Not Extended"
};

ActiveSupport.extend(ActiveController.InstanceMethods,{
    head: function head(status)
    {
        this.render({
            nothing: true,
            status: status || 200
        });
    }
});

ActiveSupport.extend(ActiveController.RenderFlags,{
    text: function text(text,params)
    {
        ActiveController.Server.Response.setHeader('Content-Type','text/plain')
        ActiveController.Server.Response.setContents(text);
    },
    json: function json(json,params)
    {
        if(typeof(json) != 'string')
        {
            json = (typeof(json.toJSON) == 'function' ? json.toJSON() : JSON.stringify(json));
        }
        ActiveController.Server.Response.setHeader('Content-Type','application/json');
        ActiveController.Server.Response.setContents(json);
    },
    xml: function xml(xml,params)
    {
        if(typeof(xml) == 'xml')
        {
            xml = xml.toString();
        }
        if(xml && typeof(xml.toXML) == 'function')
        {
            xml = xml.toXML();
        }
        ActiveController.Server.Response.setHeader('Content-Type','text/xml');
        ActiveController.Server.Response.setContents(xml);
    },
    html: function html(html,params)
    {
        ActiveController.Server.Response.setHeader('Content-Type','text/html');
        this.set('content',html);
        this.applyLayout();
        ActiveController.Server.Response.setContents(this.get('content'));
    },
    file: function file(file,params)
    {
        ActiveController.Server.Response.setHeader('Content-Type','text/html');
        var file = ActiveController.Server.Environment.getApplicationRoot() + '/views/' + file;
        if(!ActiveController.Server.IO.exists(file))
        {
            ActiveSupport.throwError(ActiveController.Errors.FileDoesNotExist,file);
        }
        var content = ActiveView.Template.create(ActiveController.Server.IO.read(file)).render(this.scope._object);
        this.set('content',content);
        this.applyLayout();
        ActiveController.Server.Response.setContents(this.get('content'));
    },    
    nothing: function nothing(nothing,params)
    {
        ActiveController.Server.Response.setContents('');
    },
    status: function status(status,params)
    {
        if(typeof(status) == 'string')
        {
            for(var status_code in ActiveController.Server.StatusCodes)
            {
                if(ActiveController.Server.StatusCodes[status_code] == status || ActiveSupport.underscore(ActiveController.Server.StatusCodes[status_code].replace(/\-/g,' ')).toLowerCase() == status)
                {
                    ActiveController.Server.Response.setStatus(status_code,ActiveController.Server.StatusCodes[status_code]);
                    break;
                }
            }
        }
        else
        {
            ActiveController.Server.Response.setStatus(status,ActiveController.Server.StatusCodes[status_code]);
        }
    }
});

ActiveView.Template.Helpers.render = function render(params,scope)
{
    var file = ActiveController.Server.Environment.getApplicationRoot() + '/views/' + params.partial;
    if(!ActiveController.Server.IO.exists(file))
    {
        ActiveSupport.throwError(ActiveController.Errors.FileDoesNotExist,file);
    }
    return ActiveView.Template.create(ActiveController.Server.IO.read(file)).render(scope || {});
};

ActiveController.InstanceMethods.applyLayout = function applyLayout()
{
    if(this.layout && !this.layoutRendered && this.layout.file)
    {
        var layout_file = Jaxer.request.app.configPath + '/app/views/' + this.layout.file;
        if(!ActiveController.Server.IO.exists(layout_file))
        {
            ActiveController.Errors.FileDoesNotExist + layout_file;
        }
        this.layoutRendered = true;
        this.set('content',ActiveView.Template.create(ActiveController.Server.IO.read(layout_file)).render(this.scope._object));
    }
};