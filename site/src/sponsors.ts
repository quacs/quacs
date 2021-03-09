import { Advert, LinkedSponsor } from "@/typings";

export const advertisers: Advert[] = [
  {
    advertiser: "Cait for GM",

    url: "https://www.caitforgm.com/home",
    altText: "Cait for GM",
    backgroundColor: "#2b517f",
    desktop_path: "/cait_for_gm/desktop.png",
    tablet_path: "/cait_for_gm/tablet.png",
    mobile_path: "/cait_for_gm/mobile.png",
  },
  {
    advertiser: "College Truckers",

    url:
      "https://www.collegetruckers.com/sign-up-3?utm_source=Quacs&utm_medium=banner&utm_campaign=Reg21",
    altText: "College Truckers",
    backgroundColor: "#28a0dd",
    desktop_path: "/college_truckers/desktop.png",
    tablet_path: "/college_truckers/tablet.png",
    mobile_path: "/college_truckers/mobile.png",
  },
];

export const roboMallardPatrons: LinkedSponsor[] = [];

export const rubberDuckPatrons: string[] = ["Enis Aras", "Chris Jerrett"];
