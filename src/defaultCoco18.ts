import { Joint, Bone } from "@/myUtils"

const DEFAULT_JOINTS = () => [
    new Joint(241, 77, "node", [255, 0, 0]),
    new Joint(241, 120, "neck", [255, 85, 0]),
    new Joint(191, 118, "right shoulder", [255, 170, 0]),
    new Joint(177, 183, "right elbow", [255, 255, 0]),
    new Joint(163, 252, "right wrist", [170, 255, 0]),
    new Joint(298, 118, "left shoulder", [85, 255, 0]),
    new Joint(317, 182, "left elbow", [0, 255, 0]),
    new Joint(332, 245, "left wrist", [0, 255, 85]),
    new Joint(225, 241, "right hip", [0, 255, 170]),
    new Joint(213, 359, "right knee", [0, 255, 255]),
    new Joint(215, 454, "right ankle", [0, 170, 255]),
    new Joint(270, 240, "left hip", [0, 85, 255]),
    new Joint(282, 360, "left knee", [0, 0, 255]),
    new Joint(286, 456, "left ankle", [85, 0, 255]),
    new Joint(232, 59, "right eye", [170, 0, 255]),
    new Joint(253, 60, "left eye", [255, 0, 255]),
    new Joint(225, 70, "right ear", [255, 0, 170]),
    new Joint(260, 72, "left ear", [255, 0, 85]),
];

const DEFAULT_BONES = [
    new Bone(1, 2, [153, 0, 0]),
    new Bone(1, 5, [153, 51, 0]),
    new Bone(2, 3, [153, 102, 0]),
    new Bone(3, 4, [153, 153, 0]),
    new Bone(5, 6, [102, 153, 0]),
    new Bone(6, 7, [51, 153, 0]),
    new Bone(1, 8, [0, 153, 0]),
    new Bone(8, 9, [0, 153, 51]),
    new Bone(9, 10, [0, 153, 102]),
    new Bone(1, 11, [0, 153, 153]),
    new Bone(11, 12, [0, 102, 153]),
    new Bone(12, 13, [0, 51, 153]),
    new Bone(1, 0, [0, 0, 153]),
    new Bone(0, 14, [51, 0, 153]),
    new Bone(14, 16, [102, 0, 153]),
    new Bone(0, 15, [153, 0, 153]),
    new Bone(15, 17, [153, 0, 102]),
];

function scaleJoints(joints: Joint[], stageWidth: number, stageHeight: number) {
    let res = joints;
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

    toJoints() : Joint[] {
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

    static deserialize(json: string): SerializedJoints {
        const data = JSON.parse(json);
        return new SerializedJoints(data.width, data.height, data.people[0].pose_keypoints_2d);
    }
}

export { DEFAULT_JOINTS, DEFAULT_BONES, scaleJoints, SerializedJoints }