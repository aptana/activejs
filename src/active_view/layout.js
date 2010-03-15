ActiveSupport.extend(InstanceMethods,{
    setTarget: function setTarget(target)
    {
        this._target = target;
        return target;
    },
    getTarget: function getTarget()
    {
        return this._target;
    }
});

ActiveView.yieldGenerator = function yieldGenerator()
{
    return function yield(element)
    {
        element = element || ActiveView.defaultStructure();
        this.setTarget(element);
    };
};