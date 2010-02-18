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