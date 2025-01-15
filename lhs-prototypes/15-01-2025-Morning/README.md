# GENERAL
sketch.js
World.js
InputSystem.js - controls (keyboard input)
MovementSystem.js
EnvironmentUtils.js - checking where objects (agents/cash registers) are positioned in the environment and their surroundings
RandomRange.js - gives you a random numerical value between a min and max

# PLAYER
TreeInteractionSystem.js - destroys trees that the player walks on

# VISUALS
RenderSystem.js
AgentRenderSystem.js
DamageRenderSystem.js
FollowerRenderSystem.js
PortraitRenderSystem.js - top left UI
SittingRenderSystem.js
TileRenderSystem.js
FaceRenderer.js - how agents look
SpriteMapping.js - how blocks/furniture looks

# UI
Money.js
PortraitRenderSystem.js - top left UI
CardData.js

# BUILDING
BuildingSystem.js - most logic in here
ConstructionTask.js
BuildingCostSystem.js
CardSystem.js
ConstructionSystem.js
TileRenderSystem.js - how blueprint blocks look, how trees and grass look 
WorkerSpawner.js
CardData.js
SpriteMapping.js - how blocks/furniture looks

# MARKET
Demand.js - basic component that, when added to agents, makes them a demander
FishingRod.js
Inventory.js
Job.js
Storage.js
Supply.js - basic component that, when added to agents, makes them a supplier
Upgraded.js
Worker.js
Goods.js
FishingSystem.js - pulls fishermen to the nearest ocean, then to a crate to deposit their goods
SupplierAttractionSystem.js
WorkAttractionSystem.js - pulls workers to available jobs (i.e. fishing rod)

# FOLLOWER/DIALOGUE
Follower.js
BubbleLogic.js - the speech bubble that appears over your follower
FollowerRenderSystem.js
FollowerSystem.js
ForestInteractionSystem.js
WindFollowerInteractionSystem.js - follower reacts to wind (doesn’t work)

# MAP
TileMap.js
TileRenderSystem.js - how blueprint blocks look, how trees and grass look 
TreeInteractionSystem.js

# AGENTS
Behaviour.js 
Emotion.js
Group.js
MovementCooldown.js
MovementSpeedMonitor.js
Name.js
Sitting.js
AgentFactory.js - function that adds agents to the world
AgentManager.js - function that decides what’s the mix of agents first spawned in
AgentRenderSystem.js
EmotionSystem.js
GroupWanderingSystem.js
MovementCooldownSystem.js
PathFollowingSystem.js
SittingRenderSystem.js
SittingSystem.js
WanderingSystem.js
FaceRenderer.js

# WEATHER
WindArrow.js
DamageRenderSystem.js
WindArrowRenderSystem.js
WindArrowSystem.js
WindFollowerInteractionSystem.js
WindDamageUtils.js

