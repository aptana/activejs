var Layout = {
    create: function create(structure,methods)
    {
        var view_class = ActiveView.create(structure,methods)
        ActiveSupport.extend(view_class.prototype,Layout.InstanceMethods);
        return view_class;
    }
};

Layout.InstanceMethods = {
    setTarget: function setTarget(target)
    {
        this._target = target;
        return target;
    },
    getTarget: function getTarget()
    {
        return this._target;
    }
};

ActiveView.Layout = Layout;