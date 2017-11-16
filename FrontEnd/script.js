var app = angular.module("app", []);
app.controller("app-cntrl", function($scope, $http) {
    $scope.queryList = ["basedOn", "directedBy", "actedBy"];
    $scope.basedOn = [ {
        name:"PersonName",
        value: "",
        isSelected: false
     }, {
        name: "Year",
        value: "",
        isSelected: false
     }, {
        name: "BirthCity",
        value: "",
        isSelected: false
     }, {
        name: "BirthCountry",
        value: "",
        isSelected: false
     }, {
        name: "Occupation",
        value: "",
        isSelected: false
     }, {
        name: "Other",
        value: "",
        isSelected: false
     }
    ];
    $scope.directedActedBy = [{
        name:"PersonName",
        value: "",
        isSelected: false
     }, {
        name: "Year",
        value: "",
        isSelected: false
     }, {
        name: "BirthCity",
        value: "",
        isSelected: false
     }, {
        name: "BirthCountry",
        value: "",
        isSelected: false
     }];
    $scope.selectedOptions = {};
    $scope.changeInWhat =  function() {
        if(this.what == "0") {
            $scope.optionList = $scope.basedOn;
        } else {
            $scope.optionList = $scope.directedActedBy;
        }
    }
    $scope.startSearch = function() {
        var enableSearch = false;
        $scope.optionList.forEach(function(element) {
            if(element.value.trim() && element.isSelected) {
                enableSearch = true;
            }
        }, this);
        if (enableSearch) {
            this.buildAndShowQuery();
            this.sendRequest();
        } else {
            alert("Please fill checked columns");
        }

    }
    $scope.buildAndShowQuery = function() {
        $scope.selctString = "$movieTitle $movie $rating";
        var queryString = "";
        var queryStringHTML = "";
        $scope.query = `SELECT distinct ${$scope.selctString}`
        $scope.query += `
WHERE {`;
        if (this.what == "0") {
            if($scope.optionList[5].isSelected) {
                $scope.query +=`
            $movie towl:movieTitle $movieTitle;
            towl:rating $rating;
            towl:keyword1 $keyword1;
            towl:keyword2 $keyword2;
            towl:keyword3 $keyword3;
            towl:keyword4 $keyword4;
            towl:keyword5 $keyword5.
            `;
            } else {
                $scope.query +=`
            $movie towl:movieTitle $movieTitle;
            towl:rating $rating.
            $person towl:basedOnPerson $movie;
            towl:personName $name;
            towl:birthCountry $country;
            towl:birthCity $city;
            towl:birthYear $year;
            towl:occupation $occupation.
            `;
            }
        } else if(this.what == "1"){
            $scope.query +=`
            $person towl:personName $name;
            towl:birthCountry $country;
            towl:birthCity $city;
            towl:birthYear $year;
            towl:occupation $occupation.
            $movie towl:directedBy $person;
            towl:movieTitle $movieTitle;
            towl:rating $rating.
            `;
        } else {
            $scope.query +=`
            $actor towl:actedBy $movie;
            towl:personName $name;
            towl:birthCountry $country;
            towl:birthCity $city;
            towl:birthYear $year;
            towl:occupation $occupation.
            $movie towl:movieTitle $movieTitle;
            towl:rating $rating.`;
        }
        $scope.optionList.forEach(function(element) {
            if(element.value.trim() && element.isSelected) {
                switch (element.name) {
                    case "PersonName": $scope.query += `
            FILTER(REGEX(str($name), "${element.value.trim()}", "i"))`;
                        break;
                    case "Year": $scope.query += `
            FILTER(xsd:integer($year) > ${element.value.trim()})`;
                        break;
                    case "BirthCity": $scope.query +=  `
            FILTER(REGEX(str($city), "${element.value.trim()}", "i"))`;
                        break;
                    case "BirthCountry": $scope.query +=  `
            FILTER(REGEX(str($country), "${element.value.trim()}", "i"))`;
                        break;
                    case "Occupation": $scope.query +=  `
            FILTER(REGEX(str($occupation), "${element.value.trim()}", "i"))`;
                        break; 
                    case "Other": $scope.query +=  `
            FILTER(contains($keyword1,"${element.value.trim()}") || contains($keyword2,"${element.value.trim()}") || contains($keyword3,"${element.value.trim()}") || contains($keyword4,"${element.value.trim()}") || contains($keyword5,"${element.value.trim()}"))`;
                        break;
                }
            }
        }, this);

        $scope.query += `
} LIMIT 25`
        $scope.query = $scope.query.trim();
    }
    $scope.sendRequest = function() {
        var url = "http://localhost:3030/ds/sparql?query=PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3EPREFIX%20owl%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3EPREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3EPREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3EPREFIX%20towl%3A%20%3Chttp%3A%2F%2Fwww.semanticweb.org%2Fcvasini%2Fontologies%2F2017%2F9%2Funtitled-ontology-4%23%3E";
        queryString = $scope.query.replace(/\r?\n|\r/g,' ');
        queryString = queryString.replace(/\s\s+/g, ' ');
        url += " " +encodeURIComponent(queryString)
        url += "&format=json"
        $http.get(url)
        .then(function(response){
            $scope.data = response.data.results.bindings;
            $scope.headers = response.data.head.vars;
            index = $scope.headers.indexOf('movie');
            if ( index != -1) {
                $scope.headers.splice(index, 1);
            }
        });
    }
    $scope.changeInCheckBox = function(option) {
        if(option.name == "Other" && option.isSelected) {
            $scope.optionList.forEach(function(optionF) {
                if(optionF.name != "Other") {
                    optionF.isSelected = false;
                    option.value = "";
                }
            });
        } else if (option.name == "PersonName" && option.isSelected) {
            $scope.optionList.forEach(function(optionF) {
                if(optionF.name != "PersonName") {
                    optionF.isSelected = false;
                    optionF.value = "";
                }
            });
        }
    }
})