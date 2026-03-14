import { Joint, Bone } from "@/myUtils"
import coco18 from "./coco18_data.json"

const DEFAULT_JOINTS = () => {
    // @ts-ignore
    return coco18.joints.map(joint => new Joint(joint[0], joint[1], joint[2]));
};

const DEFAULT_BONES = (() => {
    // @ts-ignore
    return coco18.bones.map(bone => new Bone(bone[0], bone[1], bone[2]));
})();

function scaleJoints(joints: Joint[], stageWidth: number, stageHeight: number) {
    const scaleX = stageWidth / 480;
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
        return JSON.stringify({
            width: this.width,
            height: this.height,
            people: [
                {
                    pose_keypoints_2d: this.pose
                }
            ]
        });
    }

    static deserialize(jsonStr: string): SerializedJoints {
        let jsonData = JSON.parse(jsonStr);
        return new SerializedJoints(jsonData.width, jsonData.height, jsonData.people[0].pose_keypoints_2d);
    }
}

export { DEFAULT_JOINTS, DEFAULT_BONES, scaleJoints, SerializedJoints }