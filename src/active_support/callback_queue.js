ActiveSupport.CallbackQueue = function CallbackQueue(on_complete)
{
    this.stack = [];
    this.waiting = {};
    if(on_complete)
    {
        this.setOnComplete(on_complete);
    }
};

ActiveSupport.CallbackQueue.prototype.setOnComplete = function setOnComplete(on_complete)
{
    this.onComplete = on_complete;
};

ActiveSupport.CallbackQueue.prototype.push = function push(callback)
{
    var wrapped = ActiveSupport.Function.wrap(callback || (function(){}),ActiveSupport.Function.bind(function callback_queue_wrapper(proceed){
        var i = null;
        var index = ActiveSupport.Array.indexOf(this.stack,wrapped);
        this.waiting[index] = [proceed,ActiveSupport.Array.from(arguments).slice(1)];
        var all_present = true;
        for(i = 0; i < this.stack.length; ++i)
        {
            if(!this.waiting[i])
            {
                all_present = false;
            }
        }
        if(all_present)
        {
            for(i = 0; i < this.stack.length; ++i)
            {
                var item = this.waiting[i];
                item[0].apply(item[0],item[1]);
                delete this.waiting[i];
            }
        }
        if(all_present && i === this.stack.length)
        {
            if(this.onComplete)
            {
                this.onComplete();
            }
        }
    },this));
    this.stack.push(wrapped);
    return wrapped;
};