const isElementXPercentInViewport = (el, percentVisible) => {
  let rect = el.getBoundingClientRect();
  let windowHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return !(
    Math.floor(
      100 - ((rect.top >= 0 ? 0 : rect.top) / +-(rect.height / 1)) * 100
    ) < percentVisible ||
    Math.floor(100 - ((rect.bottom - windowHeight) / rect.height) * 100) <
      percentVisible
  );
};

const createRatingLabelElement = (rating, currentResult) => {
  let newItem = document.createElement("SPAN");
  newItem.setAttribute("class", "imdb-rating");
  let textnode = document.createTextNode(rating);
  newItem.appendChild(textnode);
  currentResult.insertBefore(newItem, currentResult.childNodes[0]);
};

const addResultToFirestore = async (firebaseDocId, data) => {
  let media = db.collection("media");

  if (data !== undefined) {
    try {
      media.doc(firebaseDocId).set({
        Title: data.Title,
        Year: data.Year,
        imdbID: data.imdbID,
        imdbRating: data.imdbRating,
        imdbVotes: data.imdbVotes,
      });
      // console.log(`${await data.Title} added to Firestore with rating.`);
    } catch (error) {
      // console.error("Error writing document: ", error);
    }
  } else {
    try {
      media.doc(firebaseDocId).set({
        Title: "",
        Year: "",
        imdbID: "",
        imdbRating: "",
        imdbVotes: "",
      });
      // console.log(`${await firebaseDocId} added to db without rating.`);
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  }
};

const checkOmdb = async (firebaseDocId, truncatedTitle, currentResult) => {
  try {
    let response = await fetch(
      `https://www.omdbapi.com/?t=${truncatedTitle}&apikey=c04db74d`
    );
    let data = await response.json();

    if (typeof data.imdbRating !== "undefined") {
      createRatingLabelElement(data.imdbRating, currentResult);
      // console.log(`Got rating from OMDb for ${truncatedTitle}`);
      addResultToFirestore(firebaseDocId, data);
    } else {
      let data = undefined;
      // console.log(`Couldn't find ${truncatedTitle} in OMDb.`);
      addResultToFirestore(firebaseDocId, data);
    }
  } catch {
    console.log(`${await error} - no result for ${truncatedTitle} in OMDb.`);
  }
};

const getRatingAndCreateLabel = async (
  currentResult,
  truncatedTitle,
  firebaseDocId
) => {
  const dbDoc = db.collection("media").doc(firebaseDocId);
  try {
    let doc = await dbDoc.get();
    if (doc.exists) {
      let rating = doc.data().imdbRating;
      if (rating.includes(".") === true) {
        createRatingLabelElement(rating, currentResult);
        // console.log(`Got rating from Firestore for ${truncatedTitle}`);
      }
    } else {
      // console.log(`No ${truncatedTitle} in Firestore, checking OMDb...`);
      checkOmdb(firebaseDocId, truncatedTitle, currentResult);
    }
  } catch (error) {
    console.log("Error getting document:", error);
  }
};

const addCardRatingLabel = (currentResult) => {
  if (currentResult.getElementsByTagName("a").length > 0) {
    let resultTitle = currentResult
      .getElementsByTagName("a")[0]
      .getAttribute("aria-label");
    let truncatedTitle = resultTitle
      .split(" Season ")[0]
      .replace(/ -|,|\[|\]|\(|\)/g, "")
      .trim()
      .replace(/ /g, "+")
      .replace(":+The+Complete+First+Season", "");
    let firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
    if (
      firebaseDocId.includes("vs.") === false &&
      firebaseDocId.includes("replay:") === false
    ) {
      getRatingAndCreateLabel(currentResult, truncatedTitle, firebaseDocId);
    }
  }
};

const rateMainScreenResults = () => {
  let results = document.getElementsByClassName("tst-title-card");
  for (let i = 0; i < results.length; i++) {
    let rated = results[i].classList.contains("rated");
    let visible = isElementXPercentInViewport(results[i], 20);
    if (!rated && visible) {
      results[i].classList.add("rated");
      addCardRatingLabel(results[i]);
    }
  }
};

const addSeeMoreResultRatingLabel = (currentResult) => {
  // console.log("Adding search result rating label...");
  if (currentResult.getElementsByClassName("av-beard-title-link").length > 0) {
    let resultTitle = currentResult.getElementsByClassName(
      "av-beard-title-link"
    )[0].textContent;
    let truncatedTitle = resultTitle
      .split(" Season ")[0]
      .replace(/ -|,|\[|\]|\(|\)/g, "")
      .trim()
      .replace(/ /g, "+")
      .replace(":+The+Complete+First+Season", "");
    let firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
    if (
      firebaseDocId.includes("vs.") === false &&
      firebaseDocId.includes("replay:") === false
    ) {
      getRatingAndCreateLabel(currentResult, truncatedTitle, firebaseDocId);
    }
  }
};

const rateSeeMoreResults = () => {
  let results = document.getElementsByClassName("tst-hover-container");
  for (let i = 0; i < results.length; i++) {
    let rated = results[i].classList.contains("rated");
    let visible = isElementXPercentInViewport(results[i], 20);
    if (!rated && visible) {
      results[i].classList.add("rated");
      addSeeMoreResultRatingLabel(results[i]);
    }
  }
};

const addSearchResultRatingLabel = (currentResult) => {
  // console.log("Adding search result rating label...");
  if (currentResult.getElementsByClassName("a-size-medium").length > 0) {
    let resultTitle = currentResult.getElementsByClassName("a-size-medium")[0]
      .textContent;
    let truncatedTitle = resultTitle
      .split(" Season ")[0]
      .replace(/ -|,|\[|\]|\(|\)/g, "")
      .trim()
      .replace(/ /g, "+")
      .replace(":+The+Complete+First+Season", "");
    let firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
    if (
      firebaseDocId.includes("vs.") === false &&
      firebaseDocId.includes("replay:") === false
    ) {
      getRatingAndCreateLabel(currentResult, truncatedTitle, firebaseDocId);
    }
  }
};

const rateSearchResults = () => {
  // console.log("Rating search results...");
  let results = document.getElementsByClassName("s-result-item");
  for (let i = 0; i < results.length; i++) {
    addSearchResultRatingLabel(results[i]);
  }
};

let timer;
let debouncedRateVisibleResults = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    rateMainScreenResults();
  }, 300);
};

let debouncedRateSeeMoreResults = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    rateSeeMoreResults();
  }, 300);
};

if (
  window.location.href.includes("/gp/") ||
  window.location.href.includes("Amazon-Video")
) {
  if (window.location.href.includes("search/ref")) {
    window.addEventListener("load", rateSeeMoreResults);
    window.addEventListener("scroll", debouncedRateSeeMoreResults);
  } else {
    window.addEventListener("load", rateMainScreenResults);
    window.addEventListener("scroll", debouncedRateVisibleResults);
    window.addEventListener("click", rateMainScreenResults);
  }
}

if (window.location.href.includes("instant-video")) {
  window.addEventListener("load", rateSearchResults);
}
