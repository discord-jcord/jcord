/**
 * A Store is just a map with additional methods used for Jcord and other functionalities
 * @extends Map
 */
class Store extends Map {
  constructor(iterable) {
    super(iterable);
  }

  /**
   * Deletes a key from the Store
   * @param {String} key 
   * @returns {Store<Value>}
   */

  delete(key) {
    if (!super.has(key)) return undefined;
    let result = super.get(key);

    super.delete(key);
    return result;
  }

  /**
   * Return all objects that makes the function return true
   * @param {Function} func A function that takes an object and returns true if it matches
   * @returns {Array<Class>}
   */

  filter(func) {
    const array = [];

    for (let item of this.values()) {
      if (func(item)) {
        array.push(item);
      }
    }
    return array;
  }

  /**
   * Filters the whole Store and returns the specified value if it matches the given Function
   * @param {Function} func The function to test with
   * @returns {Class?}
   */

  find(func) {
    for (let item of this.values()) {
      if (func(item)) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Gets the Store's first item value on the Set
   * @return {Store<Value>}
   */

  first() {
    return super.get(this.keyArray()[0]);
  }

  /**
   * Returns an array of keys from the Store
   * @returns {Array?}
   */

  keyArray() {
    if (!this.size) {
      return undefined;
    }

    return Array.from(this.keys());
  }

  /**
   * Gets the Store's last item value on the Set
   * @return {Store<Value>}
   */

  last() {
    return super.get(this.keyArray()[this.keyArray().length - 1]);
  }

  /**
   * creates a new array with the results of calling a provided function on every element in the calling array.
   * @param {Function} func The function to test with
   * @returns {Array}
   */

  map(func) {
    const array = [];

    for (let item of this.values()) {
      array.push(func(item));
    }

    return array;
  }

  /**
   * Fetches a random value from the Store
   * @returns {Class?}
   */

  random() {
    if (!this.size) {
      return undefined;
    }

    return this.valueArray()[Math.floor(Math.random() * this.size)];
  }

  /**
   * Basically, this replaces `Map.set()` since `Map.set()` doesn't return the Map itself, while this does.
   * @param {String} key The key for the store
   * @param {Any} value The value of the key
   * @returns {Store<Value>}
   */

  set(key, value) {
    super.set(key, value);
    return value;
  }

  /**
   * Fetches a random key from the Store
   * @returns {Class?}
   */

  randomKeys() {
    if (!this.size) {
      return undefined;
    }

    return this.keyArray()[Math.floor(Math.random() * this.size)];
  }

  /**
   * Returns an array of values from the Store
   * @returns {Array?}
   */

  valueArray() {
    if (!this.size) {
      return undefined;
    }

    return Array.from(this.values());
  }
};

module.exports = Store;