Application.Config = {
    root: '',
    web_root: '',
    routes: [
        ['/:object/:method/:id']
    ]
};

ActiveController.logging = true;
ActiveRoutes.logging = true;
ActiveRecord.logging = true;