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

ActiveController.SWFAddressIntegration = {
    enabled: true,
    ready: false,
    lastDispatchLocation: false,
    getCurrentPath: function getCurrentPath()
    {
        var path_bits = ActiveSupport.getGlobalContext().location.href.split('#');
        return path_bits[1] && (path_bits[1].match(/^\//) || path_bits[1] == '') ? path_bits[1] : '';
    },
    externalChangeHandler: function externalChangeHandler()
    {
        if(ActiveController.SWFAddressIntegration.enabled)
        {
            var current_path = ActiveController.SWFAddressIntegration.getCurrentPath();
            if(ActiveController.SWFAddressIntegration.ready)
            {
                if(current_path != ActiveController.SWFAddressIntegration.lastDispatchLocation)
                {
                    ActiveController.routes.dispatch(current_path);
                }
            }
        }
    },
    afterDispatchHandler: function afterDispatchHandler(route,path)
    {
        if(ActiveController.SWFAddressIntegration.enabled)
        {
            SWFAddress.setValue(path);
            ActiveController.SWFAddressIntegration.lastDispatchLocation = path;
        }
    },
    setRoutesWrapper: function setRoutesWrapper(proceed,route_set)
    {
        proceed(route_set);
        SWFAddress.addEventListener(SWFAddressEvent.EXTERNAL_CHANGE,ActiveController.SWFAddressIntegration.externalChangeHandler);
        route_set.observe('afterDispatch',ActiveController.SWFAddressIntegration.afterDispatchHandler);
        ActiveController.SWFAddressIntegration.start();
    },
    start: function start()
    {
        ActiveController.SWFAddressIntegration.ready = true;
        ActiveController.routes.dispatch(ActiveController.SWFAddressIntegration.getCurrentPath());
    },
    enable: function enable()
    {
        ActiveController.SWFAddressIntegration.enabled = true;
        if(!ActiveController.SWFAddressIntegration.ready)
        {
            ActiveController.SWFAddressIntegration.start();
        }
    },
    disable: function disable()
    {
        ActiveController.SWFAddressIntegration.enabled = false;
    }
};

ActiveController.setRoutes = ActiveSupport.wrap(ActiveController.setRoutes,ActiveController.SWFAddressIntegration.setRoutesWrapper);