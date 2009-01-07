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
    file: function file(file)
    {
        
    },
    text: function text(text,args)
    {
        Jaxer.response.headers['Content-Type'] = 'text/plain';
        Jaxer.response.setContents(text);
        args.stopped = true;
    },
    json: function json(json,args)
    {
        if(typeof(json) != 'string')
        {
            json = (typeof(json.toJSON) == 'function' ? json.toJSON() : JSON.stringify(json));
        }
        Jaxer.response.headers['Content-Type'] = 'application/json';
        Jaxer.response.setContents(json);
        args.stopped = true;
    },
    xml: function xml(xml,args)
    {
        if(typeof(xml) == 'xml')
        {
            xml = xml.toString();
        }
        Jaxer.response.headers['Content-Type'] = 'text/xml';
        Jaxer.response.setContents(xml);
        args.stopped = true;
    },
    nothing: function nothing(nothing,args)
    {
        Jaxer.response.setContents('');
        args.stopped = true;
    },
    status: function status(status)
    {
        if(typeof(status) == 'string')
        {
            for(var status_code in ActiveController.StatusCodes)
            {
                if(ActiveController.StatusCodes[status_code] == status || ActiveSupport.underscore(ActiveController.StatusCodes[status_code].replace(/\-/g,' ')).toLowerCase() == status)
                {
                    Jaxer.response.statusCode = status_code;
                    Jaxer.response.reasonPhrase = ActiveController.StatusCodes[status_code];
                    break;
                }
            }
        }
        else
        {
            Jaxer.response.statusCode = status;
            Jaxer.response.reasonPhrase = ActiveController.StatusCodes[status];
        }
    }
});

ActiveController.StatusCodes = {
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