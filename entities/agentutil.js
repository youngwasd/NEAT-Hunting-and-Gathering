class AgentInputUtil {
    
    static normalizeHue = (hue) => hue/360;// 2 * (hue - 30) / (330 - 30) - 1;

    static normalizeAngle = (a) => a / Math.PI;
    
    static normalizeDistance = (distance) => 1 - Math.min(1, distance / params.AGENT_VISION_RADIUS);

    static normalizeVisionDist = (distance) => Math.max(1 - distance / (params.CANVAS_SIZE * Math.sqrt(2)), 0);

    static normalizeFoodHierarchyIndex = (index) => index / 50;
    
    static relativeLeft = (heading, vectAngle) => (heading < vectAngle ? heading + (2 * Math.PI - vectAngle) : heading - vectAngle) * -1;
    
    static relativeRight = (heading, vectAngle) => heading < vectAngle ? vectAngle - heading : vectAngle + (2 * Math.PI - heading);
    
    static randomBlueHue = () => randomFloat(31) + 225;
};

