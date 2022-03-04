import { Advert, LinkedSponsor } from "@/typings";

export const advertisers: Advert[] = [
  {
    advertiser: "Bunkabl",

    url: "https://bunkabl.com/",
    altText: "Modern homes, brought to you by Bunkabl",
    backgroundColor: "#2e755d",
    desktop_path: "/bunkabl/desktop.png",
    tablet_path: "/bunkabl/tablet.png",
    mobile_path: "/bunkabl/mobile.png",
  },
  {
    advertiser: "Nicole for GM",

    url: "",
    altText: "Vote Nicole for GM!",
    backgroundColor: "#ffffff",
    desktop_path: "/nicole_for_gm/desktop.png",
    tablet_path: "/nicole_for_gm/tablet.png",
    mobile_path: "/nicole_for_gm/mobile.png",
  },
];

export const roboMallardPatrons: LinkedSponsor[] = [];

export const rubberDuckPatrons: string[] = ["Bill Ni"];
