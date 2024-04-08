/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["laf", "sheet", "actor"],
      template: "systems/laf/templates/actor-sheet.hbs",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  async getData() {
    const rollData = this.document.getRollData();
    const data = {
      actor: this.document,
      system: this.document.system,
      enrichedNotepad: await TextEditor.enrichHTML(this.document.system.notepad, {async: true, rollData}),
      editable: this.isEditable,
      owner: this.document.isOwner,
      rollData: rollData,
      items: this.document.items.contents
    };
    data.items.sort((a, b) => {
      const sort = b.sort - a.sort;
      return sort ? sort : a.name.localeCompare(b.name);
    });
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.options.editable) return;
    html[0].querySelectorAll("[data-action=roll]").forEach(n => {
      n.addEventListener("click", this._onClickRoll.bind(this));
    });
    html[0].querySelectorAll("input[type=text], input[type=number]").forEach(n => {
      n.addEventListener("focus", (event) => event.currentTarget.select());
    });
    html[0].querySelectorAll(".item-list [data-action=item]").forEach(n => {
      n.addEventListener("click", this._onClickItem.bind(this));
    });
    html[0].querySelectorAll(".item-list [data-action=delete]").forEach(n => {
      n.addEventListener("click", this._onClickDeleteItem.bind(this));
    });
  }

  async _onClickDeleteItem(event) {
    const id = event.currentTarget.closest("[data-item-id]").dataset.itemId;
    return this.document.items.get(id).deleteDialog();
  }

  async _onClickItem(event) {
    const id = event.currentTarget.closest("[data-item-id]").dataset.itemId;
    return this.document.items.get(id).sheet.render(true);
  }

  async _onClickRoll(event) {
    const type = event.currentTarget.dataset.type;
    return this.document.roll(type);
  }
}
