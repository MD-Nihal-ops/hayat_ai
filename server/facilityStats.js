(async () => {
  const url = "http://localhost:3000/api/facilities?lat=25.2&lng=55.27&radius=3000";
  const res = await fetch(url);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.facilities || [];
  const count = (f) => list.filter(f).length;
  console.log("Facility data statistics:", list.length, count((x) => x.openingHours),
    count((x) => x.address), count((x) => x.phone));
})();(async () => {
  const url = "http://localhost:3000/api/facilities?lat=25.2&lng=55.27&radius=3000";
  const res = await fetch(url);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.facilities || [];
  const count = (f) => list.filter(f).length;
  console.log("Facility data statistics:", list.length, count((x) => x.openingHours),
    count((x) => x.address), count((x) => x.phone));
})();