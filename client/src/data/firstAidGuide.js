// --- OFFLINE FIRST-AID GUIDE CONTENT ---
// IMPORTANT: This is placeholder content. It MUST be reviewed and replaced by certified medical professionals.

export const firstAidTopics = [
  {
    id: 'severe-bleeding',
    title: 'Severe Bleeding',
    icon: '🩸',
    steps: [
      { instruction: 'CALL FOR HELP: Ensure an ambulance has been called.' },
      { instruction: 'APPLY PRESSURE: Press firmly on the wound with a clean cloth or bandage.' },
      { instruction: 'ELEVATE: If the wound is on a limb, elevate it above the heart.' },
      { instruction: 'MAINTAIN PRESSURE: Do not remove the cloth. If blood soaks through, add more cloths on top and keep pressing.' },
    ],
  },
  {
    id: 'burns',
    title: 'Burns (Minor)',
    icon: '🔥',
    steps: [
        { instruction: 'COOL THE BURN: Hold under cool (not cold) running water for 10-15 minutes.' },
        { instruction: 'REMOVE JEWELRY: Gently remove rings or other tight items from the burned area.' },
        { instruction: 'DO NOT BREAK BLISTERS: Leave blisters intact to prevent infection.' },
        { instruction: 'APPLY LOTION: Once cooled, apply a moisturizer or aloe vera gel.' },
        { instruction: 'BANDAGE: Cover the burn with a sterile gauze bandage (not fluffy cotton).' },
      ],
  },
  {
    id: 'choking',
    title: 'Choking (Adult)',
    icon: '😵',
    steps: [
        { instruction: 'ENCOURAGE COUGHING: Ask them to cough forcefully.' },
        { instruction: 'GIVE BACK BLOWS: Give 5 sharp back blows between the person’s shoulder blades with the heel of your hand.' },
        { instruction: 'GIVE ABDOMINAL THRUSTS (HEIMLICH MANEUVER): Perform 5 abdominal thrusts.' },
        { instruction: 'CONTINUE: Alternate between 5 blows and 5 thrusts until the object is dislodged.' },
      ],
  },
  {
    id: 'cpr',
    title: 'CPR (Cardiopulmonary Resuscitation)',
    icon: '❤️',
    steps: [
        { instruction: 'CHECK RESPONSIVENESS: Tap the person and shout, \'Are you OK?\'.' },
        { instruction: 'CALL FOR HELP: Tell a specific person to call for an ambulance.' },
        { instruction: 'BEGIN COMPRESSIONS: Place the heel of one hand in the center of the chest. Push hard and fast at a rate of 100-120 compressions per minute.' },
        { instruction: 'CONTINUE: Continue compressions until medical help arrives or the person starts to breathe.' },
      ],
  },
  // Add more topics as needed...
];
