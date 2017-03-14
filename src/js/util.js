/**
* @description callback function invoked for ajax request errors
*/

function errorCallback(jqxhr, settings, exception) {
    Materialize.toast("error occured: " + jqxhr.status + " " +
        jqxhr.statusText);
    clearProgressBar();
}
