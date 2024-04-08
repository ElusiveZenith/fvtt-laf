export class ActorLAF extends Actor {
  async roll(type = "laser") {
    const label = game.i18n.localize(`SIMPLE.${type === "laser" ? "Lasers" : "Feelings"}Roll`);
    return Dialog.wait({
      title: label,
      content: `<p>${label}</p>`,
      buttons: {
        normal: {
          label: game.i18n.localize("SIMPLE.Normal"),
          callback: (event) => this.makeRoll(event, {dice: "1d6", type})
        },
        prepared: {
          label: game.i18n.localize("SIMPLE.Prepared"),
          callback: (event) => this.makeRoll(event, {dice: "2d6", type})
        },
        expert: {
          label: game.i18n.localize("SIMPLE.Expert"),
          callback: (event) => this.makeRoll(event, {dice: "3d6", type})
        },
        close: {
          label: game.i18n.localize("Close")
        }
      },
      close: () => null
    });
  }

  async makeRoll(event, {dice = "1d6", type = "laser"} = {}) {
    const roll = await new Roll(dice).evaluate();

    let successes = 0;
    let laserFeelings = 0;

    const num = this.system.theOnlyStat;

    const results = roll.dice.flatMap(die => die.results.map(r => r.result));
    const label = game.i18n.localize(`SIMPLE.${type === "laser" ? "Lasers" : "Feelings"}Roll`);

    let content = `<p>${label}</p>`;
    content += `<div class="dice-tooltip"><ol class="dice-rolls">`;

    results.forEach(result => {
      let cssClass = "";
      const isLaser = (result <= num) && (type === "laser");
      const isFeeling = (result >= num) && (type === "feeling");
      const isEqual = result === num;
      if (isLaser || isFeeling) {
        cssClass = "success";
        successes++;
        if (isEqual) laserFeelings++;
      }
      content += `<li class="roll die d6 ${cssClass}">${result}</li>`;
    });

    content += `</ol></div>`;
    content += `<p class="roll success">${game.i18n.localize("SIMPLE.Successes")}: ${successes}</p>`;

    return ChatMessage.implementation.create({
      content: content,
      rolls: [roll],
      sound: CONFIG.sounds.dice,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      speaker: ChatMessage.implementation.getSpeaker({actor: this})
    });
  }
}

export class ActorSystemLAF extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      goal: new foundry.data.fields.StringField({required: true}),
      role: new foundry.data.fields.StringField({required: true}),
      style: new foundry.data.fields.StringField({required: true}),
      notepad: new foundry.data.fields.HTMLField(),
      theOnlyStat: new foundry.data.fields.NumberField({integer: true, min: 2, max: 5, initial: 3})
    };
  }

  /** @override */
  async _preCreate(data, options, userId) {
    if ((await super._preCreate(data, options, userId)) === false) return false;
    const isGM = game.user.isGM;
    const tokenData = {
      sight: {enabled: !isGM},
      actorLink: !isGM,
      disposition: CONST.TOKEN_DISPOSITIONS[!isGM ? "FRIENDLY" : "HOSTILE"],
      displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
    };
    this.updateSource({prototypeToken: tokenData});
  }
}

export class ItemLAF extends Item {}

export class ItemSystemLAF extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      description: new foundry.data.fields.HTMLField(),
      quantity: new foundry.data.fields.NumberField({integer: true, min: 0}),
      weight: new foundry.data.fields.NumberField({min: 0}),
      attributes: new foundry.data.fields.ObjectField()
    };
  }
}
