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

const addResultToFirestore = (firebaseDocId, data) => {
  let media = db.collection("media");
  if (data !== undefined) {
    media
      .doc(firebaseDocId)
      .set({
        Title: data.Title,
        Year: data.Year,
        imdbID: data.imdbID,
        imdbRating: data.imdbRating,
        imdbVotes: data.imdbVotes,
      })
      .then(() => {
        console.log(`${data.Title} added to Firestore with rating.`);
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  } else {
    media
      .doc(firebaseDocId)
      .set({
        Title: "",
        Year: "",
        imdbID: "",
        imdbRating: "",
        imdbVotes: "",
      })
      .then(() => {
        console.log(`${firebaseDocId} added to Firestore without rating.`);
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  }
};

const checkOmdb = (firebaseDocId, truncatedTitle, currentResult) => {
  fetch(`https://www.omdbapi.com/?t=${truncatedTitle}&apikey=c04db74d`).then(
    (response) => {
      response
        .json()
        .then((data) => {
          if (typeof data.imdbRating !== "undefined") {
            createRatingLabelElement(data.imdbRating, currentResult);
            // console.log(`Got rating from OMDb for ${truncatedTitle}`);
            addResultToFirestore(firebaseDocId, data);
          } else {
            let data = undefined;
            // console.log(`Couldn't find ${truncatedTitle} in OMDb.`);
            addResultToFirestore(firebaseDocId, data);
          }
        })
        .catch((error) => {
          console.log(`${error} - no result for ${truncatedTitle} in OMDb.`);
        });
    }
  );
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
      } else {
        // createRatingLabelElement("+", currentResult);
      }
    } else {
      // console.log(`No ${truncatedTitle} in Firestore, checking OMDb...`);
      checkOmdb(firebaseDocId, truncatedTitle, currentResult);
    }
  } catch (error) {
    console.log("Error getting document:", error);
  }
};

const addRatingLabel = (currentResult) => {
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

const rateVisibleResults = () => {
  // console.log("rating visible results...");
  let results = document.getElementsByClassName("tst-title-card");
  for (let i = 0; i < results.length; i++) {
    let rated = results[i].classList.contains("rated");
    let visible = isElementXPercentInViewport(results[i], 20);
    if (!rated && visible) {
      results[i].classList.add("rated");
      addRatingLabel(results[i]);
    }
  }
};

let timer;
let debouncedRateVisibleResults = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    rateVisibleResults();
  }, 400);
};

window.addEventListener("load", rateVisibleResults);
window.addEventListener("scroll", debouncedRateVisibleResults);
window.addEventListener("click", rateVisibleResults);
