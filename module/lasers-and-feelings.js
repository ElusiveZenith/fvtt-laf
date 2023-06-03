/**
 * @param {integer} diceString - Number of rice to role
 * @param {integer} num - An integer value found on the Lasers & Feelings character sheet in the number input
 * @param {RollTypes} roleType - Lasers or Feelings roll
 * @param {string} characterName - Name of the character rolling
*/
async function makeRole(diceString, num, roleType, characterName) {
  let roll = await new Roll(diceString).roll();
  let chatTemplate = evaluateRolls(roll, num, roleType);
  roll.toMessage({
    speaker: { alias: characterName },
  });
  ChatMessage.create({
    content: chatTemplate,
    roll: roll,
    speaker: { alias: characterName },
  });
}

/**
 * @param {roll} r - A Roll object
 * @param {integer} num - An integer value found on the Lasers & Feelings character sheet in the number input
 * @param {RollTypes} roleType - an integer value of 1 or 0; 1 indicates a Lasers roll, 0 indicates a Feelings roll
 * @returns {string} resultContent - the final string result of number of successes and any Laser-Feelings to be returned
*/
function evaluateRolls(r, num, roleType) {
  var array = r.terms[0].results;
  var successCount = 0;
  var laserFeelingsCount = 0;
  var resultContent = ``;

  array.forEach((element) => {
    if (
      (element.result <= num && roleType == RollTypes.Lasers) ||
      (element.result >= num && roleType == RollTypes.Feelings)
    ) {
      successCount = successCount + 1;
      if (element.result == num) {
        laserFeelingsCount = laserFeelingsCount + 1;
      }
    }
  });

  if (laserFeelingsCount > 0) {
    resultContent = `
      <p class="roll success">${game.i18n.localize(
        "SIMPLE.Successes"
      )}: ${successCount}</p> 
      <p class="roll laser-feelings">Laser Feelings: ${laserFeelingsCount}</p>
    `;
  } else {
    resultContent = `
      <p class="roll success">${game.i18n.localize(
        "SIMPLE.Successes"
      )}: ${successCount}</p> 
    `;
  }

  return resultContent;
}

/**
 * @param {String} characterName - The name of the character passed in as a string from actor-sheet.js
*/
function lasersRoll(characterName) {
  let dialogTemplate = game.i18n.localize("SIMPLE.LasersRoll");
  let thisActor = game.actors.getName(characterName);
  let num = thisActor.data.data.theOnlyStat;
  new Dialog({
    title: game.i18n.localize("SIMPLE.LasersRoll"),
    content: dialogTemplate,
    buttons: {
      normal: {
        label: game.i18n.localize(Preparedness.Normal),
        callback: () => {
          makeRole("1d6", num, RollTypes.Lasers, characterName);
        },
      },
      prepared: {
        label: game.i18n.localize(Preparedness.Prepared),
        callback: () => {
          makeRole("2d6", num, RollTypes.Lasers, characterName);
        },
      },
      expert: {
        label: game.i18n.localize(Preparedness.Expert),
        callback: () => {
          makeRole("3d6", num, RollTypes.Lasers, characterName);
        },
      },
      close: {
        label: "Close",
      },
    },
  }).render(true);
}

/**
 * @param {String} characterName - The name of the character passed in as a string from actor-sheet.js
*/
function feelingsRoll(characterName) {
  let dialogTemplate = game.i18n.localize("SIMPLE.FeelingsRoll");
  let thisActor = game.actors.getName(characterName);
  let num = thisActor.data.data.theOnlyStat;
  new Dialog({
    title: game.i18n.localize("SIMPLE.FeelingsRoll"),
    content: dialogTemplate,
    buttons: {
      normal: {
        label: game.i18n.localize(Preparedness.Normal),
        callback: () => {
          makeRole("1d6", num, RollTypes.Feelings, characterName);
        },
      },
      prepared: {
        label: game.i18n.localize(Preparedness.Prepared),
        callback: () => {
          makeRole("2d6", num, RollTypes.Feelings, characterName);
        },
      },
      expert: {
        label: game.i18n.localize(Preparedness.Expert),
        callback: () => {
          makeRole("3d6", num, RollTypes.Feelings, characterName);
        },
      },
      close: {
        label: "Close",
      },
    },
  }).render(true);
}

const RollTypes = {
  Lasers: 1,
  Feelings: 0
};

const Preparedness = {
  Normal: "SIMPLE.Normal",
  Prepared: "SIMPLE.Prepared",
  Expert: "SIMPLE.Expert",
};

export { lasersRoll, feelingsRoll };