
 
 /**
  * == DOM ==
  * The DOM section
  **/
  
  
  
  /**
   * == ajax ==
   * The AJAX section
   **/
   
   
   
   /**
    * == lang ==
    * The LANG section
    **/


/** section: DOM
 * class Element
 * The Element class
 **/

 
 
/** related to: Element
 * $(element) -> Element
 * the $ function
 **/
 
 /** section: DOM
  * $$(selector) -> Array
  * the $$ function
  **/
  


/** 
 * Element.setStyle(@element, styles) -> Element
 * - element (String | Element): an id or DOM node
 * - styles (String | Object | Hash): can be either a regular CSS string or
 * a hash or regular object, in which case, properties need to be camelized
 *
 * fires element:style:updated
 *
 * Sets the style of element
 * and returns it
 **/
 

 /** 
  * Element#foo() -> Element
  * a dummy non methodized method
  **/
  
  /** alias of: Element#foo
   * Element#bar() -> Element
   * fires click
   **/


/** section: ajax
 * Ajax
 * All requester object in the Ajax namespace share a common set of options and callbacks.
 * Callbacks are called at various points in the life-cycle of a request, and always feature 
 * the same list of arguments. They are passed to requesters right along with their other options.
 **/
var Ajax = {
  /**
   * Ajax.getTransport( ) -> XMLHttpRequest | ActiveXObject
   * returns: a new instance of the XMLHttpRequest object for
   *   standard compliant browsers, the available ActiveXObject
   *   counter part for IE.
   **/
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },
  /**
   * Ajax.activeRequestCount -> 0
   **/  
  activeRequestCount: 0,
  
  /**
   * Ajax.__private__() -> Boolean
   **/
  __private__: function() { return true }
};

/** section: ajax
 * Ajax.Responders
 * includes Enumerable
 **/
Ajax.Responders = {
  /**
   * Ajax.Responders.responders -> Array
   **/
  responders: [],
  
  _each: function(iterator) {
    this.responders._each(iterator);
  },
  
  /**
   * Ajax.Responders.register(responder) -> undefined
   * Registers a responder.
   **/
  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },
  
  /**
   * Ajax.Responders.unregister(responder) -> undefined
   * Unregisters a responder.
   **/
  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },
  /**
   * Ajax.Responders.dispatch(callback, request, transport, json) -> undefined
   * Dispatches a callback.
   **/
  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ }, 
  onComplete: function() { Ajax.activeRequestCount-- }
});

/** 
 * class Ajax.Base
 * Abstract class
 **/
 
Ajax.Base = Klass.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });
    
    this.options.method = this.options.method.toLowerCase();
    
    if (Object.isString(this.options.parameters)) 
      this.options.parameters = this.options.parameters.toQueryParams();
    else if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
/** 
 * class Ajax.Request < Ajax.Base
 * Main Ajax class
 **/


/** 
 * new Ajax.Request(url, options)
 * the Ajax Request constructor
 **/
Ajax.Request = Klass.create(Ajax.Base, {
  _complete: false,
  
  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },
  /** 
   * Ajax.Request#request(url) -> undefined
   * instanciates the request
   * not to be confused with [[Ajax.Request foo bar]]
   **/
  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      // simulate other verbs over post
      params['_method'] = this.method;
      this.method = 'post';
    }
    
    this.parameters = params;

    if (params = Object.toQueryString(params)) {
      // when GET, append parameters to URL
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }
      
    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);
    
      this.transport.open(this.method.toUpperCase(), this.url, 
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);
      
      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();
        
    }
    catch (e) {
      this.dispatchException(e);
    }
  },
  /** 
   * Ajax.Request#dummy -> "dummy"
   * a dummy instance property for the sake of testing
   **/
  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },
  
  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');
      
      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651. 
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }
    
    // user-defined headers
    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2) 
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers) 
      this.transport.setRequestHeader(name, headers[name]);
  },
  /** 
   * Ajax.Request#success() -> Boolean
   * verifies the status of the request
   **/
  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },
    
  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 } 
  },
  
  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }
      
      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType 
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }
    
    if (state == 'Complete') {
      // avoid memory leak in MSIE: clean up
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },
  
  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },
  
  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null }
  },
  
  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

/** 
 * Ajax.Request.classProp -> "dummy"
 * a dummy class property for the sake of testing
 **/
 
 
/** 
 * Ajax.Request.Events = ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete']
 * array of possible states of an xhr request
 **/
Ajax.Request.Events = 
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

Ajax.Response = Klass.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;
    
    if((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }
    
    if(readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },
  
  status:      0,
  statusText: '',
  
  getStatus: Ajax.Request.prototype.getStatus,
  
  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },
  
  getHeader: Ajax.Request.prototype.getHeader,
  
  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null } 
  },
  
  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },
  
  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },
  
  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },
  
  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' && 
      !(this.getHeader('Content-type') || '').include('application/json')) || 
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Klass.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'], 
        options = this.options;
    
    if (!options.evalScripts) responseText = responseText.stripScripts();
    
    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      } 
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Klass.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);
    
    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ? 
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});

 
 /** deprecated, section: DOM
  * Toggle
  **/
  
/** deprecated
 * Toggle.display() -> undefined
 **/
 
 /** 
  * Toggle.foo() -> undefined
  * Here is a paragraph.
  * 
  * Another... and some code examples below:
  *     
  *     alert(Toggle.foo());
  *     // -> does nothing
  *     
  *     foo.show();
  *  
  *  An HTML block
  *     
  *     language: html
  *     <div id="my_div"></div>
  *
  * Now a title.
  * ===========
  * 
  **/

/** section: lang
 * class String
 * the string class.
 **/
 
 /** section: lang
  * String.interpret(obj) -> String
  * a foo bar baz
  **/

/** section: ajax
 * class Ajax.Namespace
 **/

/**
 * class Ajax.Namespace.Manager
 **/

/** section: lang
 * mixin Enumerable
 * ruby inspired niceness
 **/
var Enumerable = {
   
   /**
    *  Enumerable#each(iterator[, context]) -> Enumerable
    *  - iterator (Function): A `Function` that expects an item in the
    *    collection as the first argument and a numerical index as the second.
    *  - context (Object): The scope in which to call `iterator`. Affects what
    *    the keyword `this` means inside `iterator`.
    * 
    * Calls `iterator` for each item in the collection.
   **/
  each: function(iterator, context) {
    var index = 0;
    iterator = iterator.bind(context);
    try {
      this._each(function(value) {
        iterator(value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  },

  eachSlice: function(number, iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  },

  all: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator(value, index);
      if (!result) throw $break;
    });
    return result;
  },

  any: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator(value, index))
        throw $break;
    });
    return result;
  },

  collect: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator(value, index));
    });
    return results;
  },

  detect: function(iterator, context) {
    iterator = iterator.bind(context);
    var result;
    this.each(function(value, index) {
      if (iterator(value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  },

  findAll: function(iterator, context) {
    iterator = iterator.bind(context);
    var results = [];
    this.each(function(value, index) {
      if (iterator(value, index))
        results.push(value);
    });
    return results;
  },

  grep: function(filter, iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(filter);

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator(value, index));
    });
    return results;
  },

  include: function(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },

  inGroupsOf: function(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  },

  inject: function(memo, iterator, context) {
    iterator = iterator.bind(context);
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  },

  invoke: function(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  },

  max: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator(value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  },

  min: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator(value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  },

  partition: function(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator(value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

  pluck: function(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  },

  reject: function(iterator, context) {
    iterator = iterator.bind(context);
    var results = [];
    this.each(function(value, index) {
      if (!iterator(value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function(iterator, context) {
    iterator = iterator.bind(context);
    return this.map(function(value, index) {
      return {value: value, criteria: iterator(value, index)};
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function() {
    return this.map();
  },

  zip: function() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  },

  size: function() {
    return this.toArray().length;
  },

  inspect: function() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
};

Object.extend(Enumerable, {
  map:     Enumerable.collect,
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  filter:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray,
  every:   Enumerable.all,
  some:    Enumerable.any
});
