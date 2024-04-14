/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SimpleItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["laf", "sheet", "item"],
      template: "systems/laf/templates/item-sheet.hbs",
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const rollData = this.document.getRollData();
    const data = {
      item: this.document,
      system: this.document.system,
      enrichedDescription: await TextEditor.enrichHTML(this.document.system.description, {async: true, rollData}),
      editable: this.isEditable,
      owner: this.document.isOwner,
      rollData: rollData,
      dtypes: {String: "String", Formula: "Formula", Boolean: "Boolean", Number: "Number", Resource: "Resource"}
    };

    data.attributes = [];
    for (const [k, v] of Object.entries(this.document.system.attributes)) {
      const isFormula = v.dtype === "Formula";
      data.attributes.push({
        ...v,
        key: k,
        isFormula: isFormula,
        isBoolean: v.dtype === "Boolean",
        isResource: (v.dtype === "Resource") || (v.dtype === "Number"),
        value: isFormula ? (Roll.validate(`${v.value}`) ? v.value : "") : v.value
      });
    }

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html[0].querySelectorAll("input[type=text], input[type=number]").forEach(n => {
      n.addEventListener("focus", (event) => event.currentTarget.select());
    });

    // Add or Remove Attribute
    html[0].querySelectorAll(".attribute-control").forEach(n => {
      n.addEventListener("click", this._onClickAttributeControl.bind(this));
    });

    html[0].querySelectorAll(".attributes-list .attribute-roll").forEach(n => {
      n.addEventListener("click", this._onClickAttributeRoll.bind(this));
    });
  }

  /* -------------------------------------------- */

  async _onClickAttributeRoll(event) {
    const formula = event.currentTarget.dataset.roll;
    const actor = this.document.actor;
    const rollData = this.document.getRollData();
    const speaker = ChatMessage.implementation.getSpeaker({actor: actor});
    return new Roll(formula, rollData).toMessage({speaker: speaker}, {rollMode: game.settings.get("core", "rollMode")});
  }

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  async _onClickAttributeControl(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;

    // Add new attribute
    if (action === "create") {
      const objKeys = new Set(Object.keys(this.document.system.attributes));
      let nk = objKeys.size + 1;
      let newValue = `attr${nk}`;
      while (objKeys.has(newValue)) {
        nk++;
        newValue = `attr${nk}`;
      }
      this.document.update({[`system.attributes.${newValue}`]: {}});
    }

    // Remove existing attribute
    else if (action === "delete") {
      const key = event.currentTarget.closest("[data-key]").dataset.key;
      this.document.update({[`system.attributes.-=${key}`]: null});
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // Handle the free-form attributes list
    const formAttrs = foundry.utils.expandObject(formData).system.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      const k = v.key.slugify({strict: true}).trim();
      if (/[\s\.]/.test(k)) {
        ui.notifications.error("Attribute keys may not contain spaces or periods");
        return obj;
      }
      delete v.key;
      obj[k] = v;
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for (const k of Object.keys(this.document.system.attributes)) {
      if (!attributes.hasOwnProperty(k)) attributes[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).reduce((obj, [k, v]) => {
      if (!k.startsWith("system.attributes")) obj[k] = v;
      return obj;
    }, {"system.attributes": attributes});

    // Update the Item
    return this.document.update(formData);
  }
}
