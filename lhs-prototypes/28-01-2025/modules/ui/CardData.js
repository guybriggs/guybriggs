// modules/ui/CardData.js

export const cardData = [
  // 1) Wall
  {
    id: 'cardWall',
    label: 'Wall',
    type: 'wall',
    icon: '🧱',
    width: 50,
    height: 70
  },

  // 2) Door
  {
    id: 'cardDoor',
    label: 'Door',
    type: 'door',
    icon: '🚪',
    width: 50,
    height: 70
  },

  // Fridge => keep '🧊' icon
  {
    id: 'fridge',
    label: 'Fridge',
    type: 'fridge',
    icon: '❄️',
    width: 30,
    height: 45
  },

  // 3) Fish Cash Register
  {
    id: 'fish_register',
    label: 'Fish Cash Register',
    type: 'cashregister',
    icon: '🐟',
    width: 30,
    height: 45
  },

  // 4) Icebox => change to '❄️' icon
  {
    id: 'icebox',
    label: 'Icebox',
    type: 'icebox',
    icon: '🧊', // different from fridge
    width: 30,
    height: 45
  },

  // 5) Fishing Rod
  {
    id: 'fishrod',
    label: 'Fishing Rod',
    type: 'fishingrod',
    icon: '🎣',
    width: 30,
    height: 45
  },

  // 6) Potato Cash Register
  {
    id: 'potato_register',
    label: 'Potato Cash Register',
    type: 'potato_cashregister',
    icon: '🥔',
    width: 30,
    height: 45
  },

  // 7) Potato Seed => change icon to '🍠'
  {
    id: 'potato_seed',
    label: 'Potato Seed',
    type: 'potato_seed',
    icon: '🍠', // different from the normal potato
    width: 30,
    height: 45
  },

  {
    id: 'fish_chips_register',
    label: 'Fish & Chips Cash Register',
    type: 'fishchips_cash',
    icon: '🍟',
    width: 30,
    height: 45
  },

  // 8) Red Carpet
  {
    id: 'red_carpet',
    label: 'Red Carpet',
    type: 'red_carpet',
    icon: '🔴',
    width: 30,
    height: 45
  },

  // Fryer
  {
    id: 'fryer',
    label: 'Fryer',
    type: 'fryer',
    icon: '🍳',
    width: 30,
    height: 45
  },

  // Potato Table => use the table icon 🍽️
  {
    id: 'potato_table_card',
    label: 'Potato Table',
    type: 'potato_table',
    icon: '🗳️', // table icon
    width: 30,
    height: 45
  },

  // Fish Table => also 🍽️, but label is "Fish Table"
  {
    id: 'fish_table_card',
    label: 'Fish Table',
    type: 'fish_table',
    icon: '📦',
    width: 30,
    height: 45
  },

  // --- All existing floors below ---

  {
    id: 'cardBedroomFloor',
    label: 'Bedroom Floor',
    type: 'bedroom_floor',
    icon: '🟫', // Dark brown square
    width: 50,
    height: 70,
  },
  {
    id: 'cardKitchenFloor',
    label: 'Kitchen Floor',
    type: 'kitchen_floor',
    icon: '🟨', // Yellow square
    width: 50,
    height: 70,
  },
  {
    id: 'cardLivingRoomFloor',
    label: 'Living Room Floor',
    type: 'livingroom_floor',
    icon: '🟧', // Orange square
    width: 50,
    height: 70,
  },
  {
    id: 'cardBathroomFloor',
    label: 'Bathroom Floor',
    type: 'bathroom_floor',
    icon: '🟦', // Blue square
    width: 50,
    height: 70,
  },
  {
    id: 'cardFarmFloor',
    label: 'Farm Floor',
    type: 'farm_floor',
    icon: '🟫', // Dark Brown
    width: 50,
    height: 70,
  },
  {
    id: 'cardFishProdFloor',
    label: 'Fish Production Floor',
    type: 'fishproduction_floor',
    icon: '⬜', // White square
    width: 50,
    height: 70,
  },
  {
    id: 'cardReceptionFloor',
    label: 'Reception Floor',
    type: 'reception_floor',
    icon: '🟪', // Purple square
    width: 50,
    height: 70,
  },
  {
    id: 'cardStaffroomFloor',
    label: 'Staffroom Floor',
    type: 'staffroom_floor',
    icon: '🟩', // Green square
    width: 50,
    height: 70,
  },
  {
    id: 'cardLoadingBayFloor',
    label: 'Loading Bay Floor',
    type: 'loadingbay_floor',
    // White square or some icon
    icon: '⬜',
    width: 50,
    height: 70
  },

];
