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

ActiveController.History = {
    index: 0,
    history: [],
    //"this" will be bound to the controller instance
    callActionAtIndex: function callActionAtIndex(index)
    {
        this[this.history.history[index][0]].apply(this,this.history.history[index][1]);
    },
    goToIndex: function goToIndex(index)
    {
        if(!this.history[index])
        {
            return false;
        }
        this.index = index;
        this.callActionAtIndex(this.index);
        return true;
    },
    /**
     * Calls the previously called action in the history.
     * @alias ActiveController.prototype.history.back
     * @return {Boolean}
     */
    back: function back()
    {
        if(this.index == 0)
        {
            return false;
        }
        --this.index;
        this.callActionAtIndex(this.index);
        return true;
    },

    /**
     * Calls the next called action in the history if back() has already
     * been called.
     * @alias ActiveController.prototype.history.next
     * @return {Boolean}
     */
    next: function next()
    {
        if(this.index >= this.history.length - 1)
        {
            return false;
        }
        ++this.index;
        this.callActionAtIndex(this.index);
        return true;
    }
};