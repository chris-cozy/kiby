/**
 * @brief Check if commands are different
 * @param {Command} existingCommand - Command object
 * @param {Command} localCommand - Command object
 * @returns boolean
 */
module.exports = (existingCommand, localCommand) => {
  const areChoicesDifferent = (existingChoices, localChoices) => {
    if ((existingChoices?.length || 0) !== (localChoices?.length || 0)) {
      return true;
    }

    for (const localChoice of localChoices || []) {
      const existingChoice = existingChoices?.find(
        (choice) => choice.name === localChoice.name
      );

      if (!existingChoice || localChoice.value !== existingChoice.value) {
        return true;
      }
    }

    return false;
  };

  const areOptionsDifferent = (existingOptions, localOptions) => {
    if ((existingOptions?.length || 0) !== (localOptions?.length || 0)) {
      return true;
    }

    for (const localOption of localOptions || []) {
      const existingOption = existingOptions?.find(
        (option) => option.name === localOption.name
      );

      if (!existingOption) {
        return true;
      }

      if (
        localOption.description !== existingOption.description ||
        localOption.type !== existingOption.type ||
        (localOption.required || false) !== (existingOption.required || false) ||
        (localOption.min_value ?? localOption.minValue ?? null) !==
          (existingOption.min_value ?? existingOption.minValue ?? null) ||
        (localOption.max_value ?? localOption.maxValue ?? null) !==
          (existingOption.max_value ?? existingOption.maxValue ?? null) ||
        areChoicesDifferent(localOption.choices || [], existingOption.choices || [])
      ) {
        return true;
      }

      if (
        areOptionsDifferent(localOption.options || [], existingOption.options || [])
      ) {
        return true;
      }
    }

    return false;
  };

  if (
    existingCommand.description !== localCommand.description ||
    areOptionsDifferent(existingCommand.options || [], localCommand.options || [])
  ) {
    return true;
  }

  return false;
};
