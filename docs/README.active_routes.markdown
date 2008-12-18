Routes.js
=========
Routes.js is a 


Catch All Routes
----------------
If you want to route all requests below a certain path to a given method, place an asterisk in your route. When a matching path is dispatched to that route the path components will be available in an array called "path".

<pre><code class="javascript">route_set.add('/wiki/*',{object:'WikiController',method:'page'})
route_set.dispatch('/wiki/a/b/c');
//calls: WikiController.page({object:'WikiController',method:'page',path:['a','b','c']})</code></pre>



Tutorial Outline
  - What are routes
  - Declaring routes
  - Methods exported to the passed scope and urlFor()
  - dispatching
  - history

var Application = {
  Blog: {
    index: function(){},
    post: function(params){
      //params will be called with id
    }
  },
  Pages: {
    index: function(){},
    contact: function()
  }
};

var routes = new Routes([
  ['root','/',{object:'Pages',method:'index'}],
  ['contact','/contact',{object:'Pages',method:'contact'}],
  ['blog','/blog',{object:'Blog',method:'index'}],
  ['post','/blog/post/:id',{object:'Blog',method:'post'}]
],Application);

var route = routes.match('/blog/post/5');
//route.params.id == 5, route.name == 'post', route.params.method == 'post'

routes.dispatch('/'); //will call Pages.index()

routes.dispatch('/blog/post/5'); //will call Blog.post({id: 5});

Application.contactUrl() == '/contact';
Application.postUrl({id: 5}) == '/blog/post/5';