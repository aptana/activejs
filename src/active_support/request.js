/**
 * class ActiveSupport.Request
 * 
 * Supports an indentical API to Prototype's [Ajax.Request/Response](http://api.prototypejs.org/ajax/),
 * but does not include handling / onException callbacks or Ajax.Responders.
 *
 * You can mimic Ajax.Responder functionality with ActiveEvent:
 * 
 *     //only needs to be done once per app, but not enabled by default
 *     ActiveEvent.extend(ActiveSupport.Request);
 *     ActiveSupport.Request.observe('onComplete',function(request,response,header_json){});
 **/
ActiveSupport.Request = function Request(url,options)
{
    this._complete = false;
    this.options = {
        method: 'post',
        asynchronous: true,
        contentType: 'application/x-www-form-urlencoded',
        encoding: 'UTF-8',
        parameters: {},
        evalJSON: true,
        evalJS: true
    };
    ActiveSupport.Object.extend(this.options,options || {});
    this.options.method = this.options.method.toLowerCase();
    this.url = url;
    this.transport = ActiveSupport.Request.getTransport();
    this.request(url);
};

ActiveSupport.Object.extend(ActiveSupport.Request.prototype,{
    request: function request()
    {
        this.method = this.options.method;
        var params = ActiveSupport.Object.clone(this.options.parameters);
        if(this.method != 'get' && this.method != 'post')
        {
            params['_method'] = this.method;
            this.method = 'post';
        }
        if(this.method == 'post')
        {
            if(this.options.postBody && this.options.postBody.indexOf('authenticity_token') == -1)
            {
                this.options.postBody = this.options.postBody.replace(/}$/,',"authenticity_token":"' + window._auth_token + '"}');
            }
            else if(params['authenticity_token'] == null)
            {
                params['authenticity_token'] = window._auth_token;
            }
        }
        this.parameters = params;
        if(params = ActiveSupport.Request.encodeParamters(params))
        {
            if(this.method == 'get')
            {
                this.url += (this.url.match(/\?/) ? '&' : '?') + params;
            }
            else if(/Konqueror|Safari|KHTML/.test(navigator.userAgent))
            {
                params += '&_=';
            }
        }
        this.transport.open(this.method.toUpperCase(),this.url,this.options.asynchronous);
        if(this.options.asynchronous)
        {
            window.setTimeout(ActiveSupport.Function.bind(this.respondToReadyState,this),1000);
        }
        this.transport.onreadystatechange = ActiveSupport.Function.bind(this.onStateChange,this);
        this.setRequestHeaders();
        this.body = this.method == 'post' ? (this.options.postBody || params) : null;
        this.transport.send(this.body);
    },
    onStateChange: function onStateChange()
    {
        var ready_state = this.transport.readyState;
        if(ready_state > 1 && !((ready_state == 4) && this._complete))
        {
            this.respondToReadyState(this.transport.readyState);
        }
    },
    setRequestHeaders: function setRequestHeaders()
    {
        var headers = {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };
        if(this.method == 'post')
        {
            headers['Content-type'] = this.options.contentType + (this.options.encoding ? '; charset=' + this.options.encoding : '');
            /* Force "Connection: close" for older Mozilla browsers to work
             * around a bug where XMLHttpRequest sends an incorrect
             * Content-length header. See Mozilla Bugzilla #246651.
             */
            if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            {
                headers['Connection'] = 'close';
            }
        }
        // user-defined headers
        if(typeof this.options.requestHeaders == 'object')
        {
            var extras = this.options.requestHeaders;
            if(typeof(extras.push) == 'function')
            {
                for(var i = 0, length = extras.length; i < length; i += 2)
                {
                    headers[extras[i]] = extras[i+1];
                }
            }
            else
            {
                for(var extra_name in extras)
                {
                    headers[extra_name] = extras[extra_name];
                }
            }
        }
        for(var name in headers)
        {
            this.transport.setRequestHeader(name,headers[name]);
        }
    },
    respondToReadyState: function respondToReadyState(ready_state)
    {
        var response = new ActiveSupport.Response(this);
        if(this.options.onCreate)
        {
            this.options.onCreate(response);
        }
        if(this.notify)
        {
            this.notify('onCreate',response);
        }
        var state = Ajax.Request.Events[ready_state];
        if(state == 'Complete')
        {
            this._complete = true;
            (this.options['on' + response.status] || this.options['on' + (this.success() ? 'Success' : 'Failure')] || function(){})(response,response.headerJSON);
            var content_type = response.getHeader('Content-type');
            if(this.options.evalJS == 'force' || (this.options.evalJS && this.isSameOrigin() && content_type && content_type.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
            {
                this.evalResponse();
            }
        }
        (this.options['on' + state] || function(){})(response,response.headerJSON);
        if(this.notify)
        {
            this.notify('on' + state,response,response.headerJSON);
        }
        if(state == 'Complete')
        {
            // avoid memory leak in MSIE: clean up
            this.transport.onreadystatechange = function(){};
        }
    },
    getStatus: function getStatus()
    {
        try
        {
            return this.transport.status || 0;
        }
        catch(e)
        {
            return 0;
        }
    },
    success: function success()
    {
        var status = this.getStatus();
        return !status || (status >= 200 && status < 300);
    },
    getHeader: function getHeader(name)
    {
        try
        {
            return this.transport.getResponseHeader(name) || null;
        }
        catch(e)
        {
            return null;
        }
    },
    evalResponse: function evalResponse()
    {   
        return eval((this.transport.responseText || '').replace(/^\/\*-secure-([\s\S]*)\*\/\s*$/,'$1'));
    },
    isSameOrigin: function isSameOrigin()
    {
        var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
        return !m || (m[0] == location.protocol + '//' + document.domain + location.port ? ':' + location.port : '');
    }
});

ActiveSupport.Object.extend(ActiveSupport.Request,{
    events: [
        'Uninitialized',
        'Loading',
        'Loaded',
        'Interactive',
        'Complete'
    ],
    getTransport: function getTransport()
    {
        try
        {
            return new XMLHttpRequest();
        }
        catch(e)
        {
            try
            {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }
            catch(e)
            {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        }
    },
    encodeParamters: function encodeParamters(params)
    {
        var response = [];
        for(var param_name in params)
        {
            param_name = encodeURIComponent(param_name);
            var values = params[param_name];
            if(values && typeof values == 'object')
            {
                if(ActiveSupport.Object.isArray(values))
                {
                    var values_response = [];
                    for(var i = 0; i < values.length; ++i)
                    {
                        values_response.push(ActiveSupport.Request.toQueryPair(key,values[i]));
                    }
                    response.push(values_response.join('&'));
                }
            }
            else
            {
                response.push(ActiveSupport.Request.toQueryPair(key,values));
            }
        }
        return response.join('&');
    },
    toQueryPair: function toQueryPair(key,value)
    {
        if(typeof(value) == 'undefined')
        {
            return key;
        }
        else
        {
            return key + '=' + encodeURIComponent(value == null ? '' : String(value));
        }
    }
});

ActiveSupport.Response = function Response(request)
{
    var global_context = ActiveSupport.getGlobalContext();
    var ie = !!(global_context.attachEvent && !global_context.opera);
    
    this.status = 0;
    this.statusText = '';
    this.getStatus = request.getStatus;
    this.getHeader = request.getHeader;
    
    this.request = request;
    var transport = this.transport = request.transport;
    var ready_state = this.readyState = transport.readyState;
    if((ready_state > 2 && !ie) || ready_state == 4)
    {
        this.status = this.getStatus();
        this.statusText = this.getStatusText();
        this.responseText = transport.responseText;
        this.headerJSON = this.getHeaderJSON();
    }
    if(ready_state == 4)
    {
        var xml = transport.responseXML;
        this.responseXML = typeof(xml) == 'undefined' ? null : xml;
        this.responseJSON = this.getResponseJSON();
    }
};
ActiveSupport.Object.extend(ActiveSupport.Response.prototype,{
    getStatusText: function getStatusText()
    {
        try
        {
            return this.transport.statusText || '';
        }
        catch(e)
        {
            return '';
        }
    },
    getHeaderJSON: function getHeaderJSON()
    {
        var json = this.getHeader('X-JSON');
        if(!json)
        {
            return null;
        }
        json = decodeURIComponent(escape(json));
        return ActiveSupport.JSON.parse(json);
    },
    getResponseJSON: function getResponseJSON()
    {
        var options = this.request.options;
        if(!options.evalJSON || (options.evalJSON != 'force' && !((this.getHeader('Content-type') || '').indexOf('application/json') > -1)) || (!this.responseText || this.responseText == ''))
        {
            return null;
        }
        return ActiveSupport.JSON.parse(this.responseText);
    }
});