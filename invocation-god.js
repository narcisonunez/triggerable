var invocator = {
  "theme": "default", // UI theme to be used.
  "container": "", // Input Element where the user will be typing.
  "triggerPrefix": "", // The character to be used to invoke any trigger registered.
  "invocationTriggers": [], // Array containing all the triggers registered.

  /* Object confirutation entry point
  * @param container - Input Element where the user will be typing.
  * @param triggerPrefix - The character to be used to invoke any trigger registered.
  * return undefined
  */
  init: function(container, triggerPrefix) {
      this.triggerPrefix = triggerPrefix || "@"; // @ Is the default triggerPrfix
      this.container = container;

      this.bind();
  },

  /* Bind will be binding the input field provided as container to the event "keyup"
  *  This allow us to know when a trigger is found and the action to take
  */
  bind: function(){
      var me = this;

      document.getElementById(me.container).addEventListener('keyup', function(event){
          var inputText = this.value.split(" ");
          var trigger = inputText[inputText.length - 2];
          var queryString = inputText[inputText.length - 1];
          var triggerName = trigger ? trigger.substring(1) : '';

          if (trigger &&
            trigger.startsWith(me.triggerPrefix) &&
            me.invocationTrigger(triggerName) &&
            me.exists(triggerName)
          ) {
              var trigger = me.invocationTrigger(triggerName)[0];

              me.sendRequest(trigger, trigger.urls.all);

          }
      });
  },

  /* Check if the trigger passed as parameter exists in the invocationTriggers array
  */
  exists: function(triggerName){
      var triggers = this.invocationTriggers.filter(function(invocationTrigger){
          return invocationTrigger.name == triggerName;
      });

      return triggers.length ? true : false;
  },

  /* Add a new trigger to the invocationTriggers array
  */
  add: function(trigger){
      this.invocationTriggers.push(trigger);
  },

  /* Add an array of new triggers to be registered in the invocationTriggers array
  */
  set: function(triggers){
      var me = this;

      triggers.forEach(function(invocationTrigger){
          me.add(invocationTrigger);
      });
  },

  /* Return the trigger passed as parameter if exists, otherwise, return all the triggers
  * @param trigger - The name of an specific trigger to fetch
  */
  invocationTrigger: function(trigger){
      var me = this;
      if (trigger) {
        return me.invocationTriggers.filter(function(invocationTrigger){
            return invocationTrigger.name == trigger;
        });
      }
      return this.invocationTriggers;
  },

  /* Check if the trigger exists and return the its urls object
  * @param triggerName
  */
  invocationTriggerUrl: function(triggerName){
      return this.exists(triggerName) ? this.invocationTrigger(triggerName)[0].urls : {};
  },

  sendRequest: function(trigger, url) {
      var me = this;
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var items = JSON.parse(this.responseText);
          me.render(trigger, items);
        }
      };

      xhttp.open("GET", url, true);
      xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
      xhttp.send();
  },

  /* Render all the results provided by the urls.all of a trigger urls object
  * @param trigger - the trigger responsable for the action
  * @param items - All the data coming from the request
  * return undefined
  */
  render: function(trigger, items){
    var me = this;
    var resultListElement = document.getElementById('popup-container');
    var html = '';
    resultListElement.innerHTML = "";
    items.forEach(function(item){
      html = html + me.renderItem(trigger, item);
    });

    resultListElement.innerHTML = html;
    resultListElement.style.display = "block";

    me.reloadListeners(trigger);
  },

  /* Render an specific list item result
  * @param trigger - the trigger responsable for the action
  * @param item - The specific data object for a list item result
  * return string
  */
  renderItem: function(trigger, item){
    var image = false;
    if ('image' in trigger){
         image = item[trigger.image.imageKey]
    }

    return this.template()
            .replace("{data}", 'data-title="'+ item[trigger.titleKey] +'" data-code="'+ item[trigger.codeKey] +'"')
            .replace("{hasImage}", image || 'style="display: none;"')
            .replace("{image}", image ?  item[ trigger.image.imageKey ] : '' )
            .replace("{title}", item[trigger.titleKey])
            .replace("{subtitle}", trigger.subtitle ? item[trigger.subtitle.subtitleKey] : '');
  },

  /* the specific item list template to be draw or created for each item in the results
  */
  template: function(){
      return '<li class="popup-result item-result" {data}>' +
                '<figure class="popup-result-img" {hasImage}">' +
                    '<img src="{image}" alt="" >' +
                '</figure>' +
                '<div class="popup-result-content">' +
                  '<div class="popup-result-content-title">{title}</div>' +
                  '<div class="popup-result-content-desc">{subtitle}</div>' +
                '</div>' +
              '</li>';
  },

  reloadListeners: function(trigger){
    var resultList = document.getElementsByClassName('item-result');
    var me = this;
    for (var i = 0; i < resultList.length; i++) {
      resultList[i].addEventListener('click', function(event){
        me.onItemListClick(trigger, this);
      });
    }
  },

  onItemListClick: function(trigger, clickedElement){
      var title = clickedElement.dataset.title;
      var code = clickedElement.dataset.code;
      var text = document.getElementById(this.container).value;
      text = text.replace(this.triggerPrefix + trigger.name, "[" + trigger.name + "]" + "[" + code + "]" + "[" + title + "]");
      document.getElementById(this.container).value = text;
      document.getElementById(this.container).focus();
      document.getElementById('popup-container').style.display = "none";
  }
};
