import { lasersRoll, feelingsRoll } from "./lasers-and-feelings.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["lasers-and-feelings", "sheet", "actor"],
      template: "systems/lasers-and-feelings/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.system = this.actor.system;
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    //localizing labels on the character sheet
    $(html).parents(".app").find(".numbersLabel")[0].innerText =
      game.i18n.localize("SIMPLE.Number");
    $(html).parents(".app").find("#styleLabel")[0].innerText =
      game.i18n.localize("SIMPLE.Style");
    $(html).parents(".app").find("#roleLabel")[0].innerText =
      game.i18n.localize("SIMPLE.Role");
    $(html).parents(".app").find("#goalLabel")[0].innerText =
      game.i18n.localize("SIMPLE.Goal");
    var characterName = $(html)
      .parents(".app")
      .find(".sheet-header h1.charname input")[0].value;

    html.find("a.lasers").click(() => {
      lasersRoll(characterName);
    });
    html.find("a.feelings").click(() => {
      feelingsRoll(characterName);
    });
  }
}
