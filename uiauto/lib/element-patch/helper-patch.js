/* globals $, env */

(function () {
  UIAElement.prototype.setValueByType = function (newValue) {
    var type = this.type();

    if (type === "UIATextField" || type === "UIASecureTextField" ||
        type === "UIATextView" || type === "UIASearchBar") {
      if (this.hasKeyboardFocus() === 0) {
        this.tap();
      }
      if (isAccented(newValue)) {
        this.setValue(newValue);
      } else {
        /*
         * Sending large chunks of text, especially with capital letters,
         * often muddles the input causing errors where keys are not
         * found. Breaking into individual letters, while slower, fixes
         * the problem.
         */
        for (var i = 0; i < newValue.length; i++) {
          var c = newValue.charAt(i);
          try {
            $.sendKeysToActiveElement(c);
          } catch (e) {
            // retry once
            $.debug("Error typing '" + c + "': " + e);
            $.debug("Retrying...");
            $.sendKeysToActiveElement(c);
          }
          if (env.interKeyDelay) {
            $.delay(env.interKeyDelay);
          }
        }
      }
    } else if (type === "UIAPickerWheel") {
      this.selectValue(newValue);
    } else if (type === "UIASlider") {
      this.dragToValue(parseFloat(newValue));
    } else if (type === "UIAPageIndicator") {
      this.selectPage(parseInt(newValue, 10));
    } else {
      this.setValue(newValue);
    }
  };

  var isAccented = function (value) {
    for (var i = 0; i < value.length; i++) {
      var c = value.charCodeAt(i);
      if (c > 127) {
        // this is not simple ascii
        if (c >= parseInt("E000", 16) && c <= parseInt("E040", 16)) {
          // Selenium uses a Unicode PUA to cover certain special characters
          // see https://code.google.com/p/selenium/source/browse/java/client/src/org/openqa/selenium/Keys.java
          return false;
        }

        return true;
      }
    }

    return false;
  };

  UIAElement.prototype.type = function () {
    var type = this.toString();
    return type.substring(8, type.length - 1);
  };

  UIAElement.prototype.isDuplicate = function () {
    var res = false;
    var type = this.type();
    if (type.match(/textfield$/i)) {
      var parent = this.parent();
      res = parent && parent.type() === type;
    }
    return res;
  };

  UIAElement.prototype.hasChildren = function () {
    var type = this.type();
    // NOTE: UIALink/UIAImage/UIAElement can have children
    return !(type === "UIAStaticText" || type === "UIATextField" ||
             type === "UIASecureTextField" || type === "UIAButton" ||
             type === "UIASwitch" || type === "UIAElementNil");
  };

  UIAElement.prototype.text = function () {
    var type = this.type();
    var value = this.value();
    if (type === "UIATextField") {
      return value;
    }
    var label = this.label();
    if (label) return label;
    return value;
  };

  UIAElement.prototype.matchesTagName = function (tagName) {
    var type = this.type();
    // i.e. "UIALink" matches "link:
    return type.substring(3).toLowerCase() === tagName.toLowerCase();
  };

  UIAElement.prototype.matchesBy = function (tagName, text) {
    if (!this.matchesTagName(tagName))
      return false;
    if (text === '')
      return true;
    var name = this.name();
    if (name)
      name = name.trim();
    if (name === text)
      return true;
    var value = this.value();
    if (value)
      value = String(value).trim();
    return value === text;
  };

  UIAElement.prototype.getElementLocation = function () {
    return this.rect().origin;
  };

  UIAElement.prototype.getElementSize = function () {
    return this.rect().size;
  };

  UIAElement.prototype.isDisplayed = function () {
    return this.isVisible() === 1;
  };

  UIAElement.prototype.isSelected = function () {
    return this.value() === 1;
  };

})();
