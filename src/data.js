const [itemData, region] = await Promise.all([
 fetch(new URL('../jx2-like-交付/设计规格-v0.1/data/items-v0.1.json', import.meta.url)).then(r=>r.json()),
 fetch(new URL('../jx2-like-交付/设计规格-v0.1/data/region-bianjing-east.json', import.meta.url)).then(r=>r.json())
]);
export { itemData, region };
