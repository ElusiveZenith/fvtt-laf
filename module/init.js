import { SimpleActorSheet } from "./actor-sheet.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function() {
  console.log(`Initializing Lasers & Feelings System`);
 
  game.settings.register("laf", "Name", {
    name: "SIMPLE.Name",
    hint: "SIMPLE.Name",
    scope: "world",
    type: String,
    default: true,
    config: true
  });

  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("laf", SimpleActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("laf", SimpleItemSheet, { makeDefault: true });

  // Register system settings
  game.settings.register("laf", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register initiative setting.
  game.settings.register("laf", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d20",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("laf", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    // If the formula is valid, use it.
    try {
      new Roll(formula).roll();
      CONFIG.Combat.initiative.formula = formula;
      if (notify) {
        ui.notifications.notify(game.i18n.localize("SIMPLE.NotifyInitFormulaUpdated") + ` ${formula}`);
      }
    }
    // Otherwise, fall back to a d20.
    catch (error) {
      CONFIG.Combat.initiative.formula = "1d20";
      if (notify) {
        ui.notifications.error(game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid") + ` ${formula}`);
      }
    }
  }
});

/**
 * Adds the actor template context menu.
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {
  // Define an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li[0].dataset.entryId);
      return !actor.getFlag("laf", "isTemplate");
    },
    callback: li => {
      const actor = game.actors.get(li[0].dataset.entryId);
      actor.setFlag("laf", "isTemplate", true);
    }
  });

  // Undefine an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const actor = game.actors.get(li[0].dataset.entryId);
      return actor.getFlag("laf", "isTemplate");
    },
    callback: li => {
      const actor = game.actors.get(li[0].dataset.entryId);
      actor.setFlag("laf", "isTemplate", false);
    }
  });
});

/**
 * Adds the item template context menu.
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {
  // Define an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const item = game.items.get(li[0].dataset.entryId);
      return !item.getFlag("laf", "isTemplate");
    },
    callback: li => {
      const item = game.items.get(li[0].dataset.entryId);
      item.setFlag("laf", "isTemplate", true);
    }
  });

  // Undefine an item as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const item = game.items.get(li[0].dataset.entryId);
      return item.getFlag("laf", "isTemplate");
    },
    callback: li => {
      const item = game.items.get(li[0].dataset.entryId);
      item.setFlag("laf", "isTemplate", false);
    }
  });
});


/**
 * Adds the actor template selection dialog.
 */
ActorDirectory.prototype._onCreate = async (event) => {
  // Do not allow the creation event to bubble to other listeners
  event.preventDefault();
  event.stopPropagation();

  _simpleDirectoryTemplates('actor');
}

/**
 * Adds the item template selection dialog.
 */
ItemDirectory.prototype._onCreate = async (event) => {
  // Do not allow the creation event to bubble to other listeners
  event.preventDefault();
  event.stopPropagation();

  _simpleDirectoryTemplates('item');
}

/**
 * Display the entity template dialog.
 *
 * Helper function to display a dialog if there are multiple template types
 * defined for the entity type.
 *
 * @param {string} entityType - 'actor' or 'item'
 */
async function _simpleDirectoryTemplates(entityType = 'actor') {
  // Retrieve the collection and class.
  const entityCollection = entityType == 'actor' ? game.actors : game.items;
  const cls = entityType == 'actor' ? Actor : Item;

  // Query for all entities of this type using the "isTemplate" flag.
  let entities = entityCollection.filter(a => a.data.flags?.laf?.isTemplate === true);

  // Initialize variables related to the entity class.
  let ent = game.i18n.localize(cls.config.label);

  // Setup entity data.
  let type = entityType == 'actor' ? 'character' : 'item';
  let createData = {
    name: `New ${ent}`,
    type: type,
    folder: event.currentTarget.dataset.folder
  };

  // If there's more than one entity template type, create a form.
  if (entities.length > 0) {
    // Build an array of types for the form, including an empty default.
    let types = [{
      value: null,
      label: game.i18n.localize("SIMPLE.NoTemplate")
    }];

    // Append each of the user-defined actor/item types.
    types = types.concat(entities.map(a => {
      return {
        value: a.data.name,
        label: a.data.name
      }
    }));

    // Render the entity creation form
    let templateData = {upper: ent, lower: ent.toLowerCase(), types: types},
        dlg = await renderTemplate(`systems/laf/templates/sidebar/entity-create.html`, templateData);

    // Render the confirmation dialog window
    new Dialog({
      title: `Create ${createData.name}`,
      content: dlg,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: `Create ${ent}`,
          callback: html => {
            // Get the form data.
            const form = html[0].querySelector("form");
            mergeObject(createData, validateForm(form));

            // Store the type and name values, and retrieve the template entity.
            let templateActor = entityCollection.getName(createData.type);

            // If there's a template entity, handle the data.
            if (templateActor) {
              // Update the object with the existing template's values.
              createData = mergeObject(templateActor.data, createData, {inplace: false});
              createData.type = templateActor.data.type;
              // Clear the flag so that this doesn't become a new template.
              delete createData.flags.laf.isTemplate;
            }
            // Otherwise, restore to a valid entity type (character/item).
            else {
              createData.type = type;
            }

            cls.create(createData, {renderSheet: true});
          }
        }
      },
      default: "create"
    }).render(true);
  }
  // Otherwise, just create a blank entity.
  else {
    cls.create(createData, {renderSheet: true});
  }
}