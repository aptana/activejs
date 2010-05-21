/**
 * class ActiveSupport.CallbackQueue
 * Allows for the execution of callbacks in the order they are registered.
 * 
 *     var queue = new ActiveSupport.CallbackQueue(function(){
 *         console.log('Callback queue empty.');
 *     });
 *     new ActiveSupport.Request(url,{
 *         onComplete: queue.push(function(){
 *             console.log('Ajax Request finished.');
 *         })
 *     });
 *     var callback_two = queue.push(function(){
 *         console.log('"callback_two" called.');
 *     });
 *     callback_two();
 *     var callback_three = queue.push(function(){
 *         console.log('"callback_three" called.');
 *     });
 *     callback_three();
 * 
 * Ajax callback finishes after `callback_two` and `callback_three`, but 
 * output to the console would still be:
 * 
 *     //Ajax Request finished.
 *     //"callback_two" called.
 *     //"callback_three" called.
 *     //Callback queue empty.
 * 
 * Note that ActiveSupport.CallbackQueue will only function if the first callback
 * added will be called asynchronously (as a result of an Ajax request or setTimeout
 * call).
 **/
 
/**
 * new ActiveSupport.CallbackQueue(on_complete[,context])
 * - on_complete (Function): The function to call when all callacks are completed.
 * - context (Object): optional context to bind the on_complete function to.
 **/
ActiveSupport.CallbackQueue = function CallbackQueue(on_complete)
{
    on_complete = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(on_complete || function(){},arguments,1);
    this.stack = [];
    this.waiting = {};
    if(on_complete)
    {
        this.setOnComplete(on_complete || function(){});
    }
};

ActiveSupport.CallbackQueue.prototype.setOnComplete = function setOnComplete(on_complete)
{
    this.onComplete = on_complete;
};

/**
 * ActiveSupport.CallbackQueue#push(callback[,context]) -> Function
 **/
ActiveSupport.CallbackQueue.prototype.push = function push(callback)
{
    callback = ActiveSupport.Function.bindAndCurryFromArgumentsAboveIndex(callback || function(){},arguments,1);
    var wrapped = ActiveSupport.Function.wrap(callback,ActiveSupport.Function.bind(function callback_queue_wrapper(proceed){
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