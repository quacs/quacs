import { Department, CatalogCourse } from "@/typings";

import COURSES_JSON from "./data/courses.json";
import CATALOG_JSON from "./data/catalog.json";

export default {
  departments: COURSES_JSON as Department[],
  catalog: CATALOG_JSON as { [id: string]: CatalogCourse }
};
