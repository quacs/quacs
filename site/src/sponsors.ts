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
    advertiser: "Chi Phi",

    url: "http://thetaofchiphi.org/",
    altText:
      "The Brothers of the Chi Phi Fraternity wish you a successful course registration!",
    backgroundColor: "#ffffff00",
    desktop_path: "/chi_phi/desktop.png",
    tablet_path: "/chi_phi/tablet.png",
    mobile_path: "/chi_phi/mobile.png",
  },
];

export const roboMallardPatrons: LinkedSponsor[] = [];

export const rubberDuckPatrons: string[] = [
  "Enis Aras",
  "Chris Jerrett",
  "Bill Ni",
  "Brian Hotopp",
];
