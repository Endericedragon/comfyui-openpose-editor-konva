from typing import TypedDict


class Person(TypedDict):
    pose_keypoints_2d: list[float]


class SkeletonData(TypedDict):
    width: int
    height: int
    people: list[Person]


class Coco18Data(TypedDict):
    joints: list[tuple[float, float, tuple[int, int, int]]]  # x, y, [r, g, b]
    bones: list[tuple[int, int, tuple[int, int, int]]]  # from, to, [r, g, b]


class PoseKpPerson(TypedDict):
    pose_keypoints_2d: list[float]


class PoseKeypoint(TypedDict):
    people: list[PoseKpPerson]
