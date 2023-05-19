const { Command } = require('discord.js');

/**
 * @brief Check if commands are different
 * @param {Command} existingCommand - Command object
 * @param {Command} localCommand - Command object
 * @returns boolean
 */
module.exports = (existingCommand, localCommand) => {
    // Check if the command's choices are different
    const are_choices_different = (existingChoices, localChoices) => {
        for (const localChoice of localChoices) {
            const existingChoice = existingChoices?.find(
                (choice) => choice.name === localChoice.name
            );

            if ((!existingChoice) || (localChoice.value !== existingChoice.value)) {
                return true;
            }
        }
        return false;
    };

    // Check if the command's options are different
    const are_options_different = (existingOptions, localOptions) => {
        for (const localOption of localOptions) {
            const existingOption = existingOptions?.find(
                (option) => option.name === localOption.name
            );

            if (!existingOption) {
                return true;
            }

            if (
                localOption.description !== existingOption.description ||
                localOption.type !== existingOption.type ||
                (localOption.required || false) !== existingOption.required ||
                (localOption.choices?.length || 0) !==
                (existingOption.choices?.length || 0) ||
                are_choices_different(
                    localOption.choices || [],
                    existingOption.choices || []
                )
            ) {
                return true;
            }
        }
        return false;
    };

    // Checks if the command's description is the same, or if the options have changed
    if (
        existingCommand.description !== localCommand.description ||
        existingCommand.options?.length !== (localCommand.options?.length || 0) ||
        are_options_different(existingCommand.options, localCommand.options || [])
    ) {
        return true;
    }

    return false;
};