import { triple2ColorStr, tryParseJson } from "@/myUtils"
import coco18 from "./coco18_data.json"

class Joint {
    x: number;
    y: number;
    color: string;

    constructor(x: number, y: number, color: number[]) {
        this.x = x;
        this.y = y;
        this.color = triple2ColorStr(color);
    }
}

class Bone {
    from: number;
    to: number;
    color: string;

    constructor(from: number, to: number, color: number[]) {
        this.from = from;
        this.to = to;
        this.color = triple2ColorStr(color);
    }

    getKonvaBonePoints(jointMapping: Joint[]) {
        const fromJoint = jointMapping[this.from];
        const toJoint = jointMapping[this.to];
        if (!fromJoint || !toJoint) {
            throw new Error("Invalid joint index");
        }
        return [fromJoint.x, fromJoint.y, toJoint.x, toJoint.y];
    }

    getEllipseConfig(jointMapping: Joint[], currentStageScale: number) {
        const jointFrom = jointMapping[this.from];
        const jointTo = jointMapping[this.to];
        if (!jointFrom || !jointTo) {
            throw new Error("Invalid joint index");
        }
        const centerX = (jointFrom.x + jointTo.x) / 2;
        const centerY = (jointFrom.y + jointTo.y) / 2;
        const boneLength = Math.sqrt((jointTo.x - jointFrom.x) ** 2 + (jointTo.y - jointFrom.y) ** 2);
        const boneAngle = Math.atan2(jointTo.y - jointFrom.y, jointTo.x - jointFrom.x) * 180 / Math.PI;
        return {
            x: centerX,
            y: centerY,
            radiusX: boneLength / 2,
            radiusY: 3 / currentStageScale,
            rotation: boneAngle,
            fill: this.color,
            strokeWidth: 0,
        };
    }
}

const DEFAULT_JOINTS = () => {
    // @ts-ignore
    return coco18.joints.map(joint => new Joint(joint[0], joint[1], joint[2]));
};

const DEFAULT_BONES = (() => {
    // @ts-ignore
    return coco18.bones.map(bone => new Bone(bone[0], bone[1], bone[2]));
})();

function scaleJoints(joints: Joint[], stageWidth: number, stageHeight: number) {
    const scaleX = Math.min(stageWidth, stageHeight) / 480;
    joints.map(joint => {
        joint.x *= scaleX;
        joint.y *= scaleX;
    });
    const deltaX = joints[1].x - Math.floor(stageWidth / 2);
    const deltaY = joints[8].y - Math.floor(stageHeight / 2);
    joints.map(joint => {
        joint.x -= deltaX;
        joint.y -= deltaY;
    });
}

class SerializedJoints {
    width: number;
    height: number;
    pose: number[]; // flat array

    constructor(width: number, height: number, pose: number[]) {
        this.width = width;
        this.height = height;
        this.pose = pose;
    }

    static fromJoints(joints: Joint[], stageWidth: number, stageHeight: number): SerializedJoints {
        return new SerializedJoints(stageWidth, stageHeight, joints.flatMap(joint => [joint.x, joint.y, 1]));
    }

    toJoints(): Joint[] {
        const pose = this.pose;
        let baseResult = DEFAULT_JOINTS();
        for (let i = 0; i < pose.length; i += 3) {
            baseResult[i / 3].x = pose[i];
            baseResult[i / 3].y = pose[i + 1];
        }
        return baseResult;
    }

    serialize() {
        return JSON.stringify(this.toObj());
    }

    toObj() {
        return {
            width: this.width,
            height: this.height,
            people: [
                {
                    pose_keypoints_2d: this.pose
                }
            ]
        };
    }
    /**
     * 将json字符串解析为SeriailizedJoints对象，不做错误处理，let it crashes
     * @param jsonStr 待解析的json字符串
     * @returns 
     */
    static deserialize(jsonStr: string): SerializedJoints {
        let jsonData = tryParseJson(jsonStr);
        return new SerializedJoints(jsonData.width, jsonData.height, jsonData.people[0].pose_keypoints_2d);
    }
}

export { Joint, Bone, DEFAULT_JOINTS, DEFAULT_BONES, scaleJoints, SerializedJoints }