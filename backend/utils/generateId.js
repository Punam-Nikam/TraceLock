// Generate unique employee UID per company
// Format: TL-[companyId]-[number]
// e.g. Company 1: TL-1-0001, Company 2: TL-2-0001
// This ensures no duplicates across companies

const generateEmployeeUID = (companyId, number) => {
  return `TL-${companyId}-${String(number).padStart(4, '0')}`;
};

module.exports = { generateEmployeeUID };