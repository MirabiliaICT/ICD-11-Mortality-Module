

import { useState, useEffect } from "react";
import { connect } from "react-redux";

import { 
  Button,
  Modal,
  Tooltip
} from "antd";

/* Styling tools */
import { useTranslation } from "react-i18next";
import moment from "moment";
import InputField from "../InputField";
import Icd11Tool from "../Icd11Tool/EmbeddedIcd11Tool";
import "./stage.css";

/* REDUX */

import {
  mutateEvent,
  mutateDataValue,
  initNewEvent,
} from "../../redux/actions/data";

/* Utils */
import { generateCode } from "../../utils";


const Stage = ({
  metadata,
  data,
  mutateEvent,
  mutateDataValue,
  initNewEvent
}) => {
  const { t } = useTranslation();

  const [icdTool, setIcdTool] = useState(false);
  const [activeCauseOfDeath, setActiveCauseOfDeath] = useState("");
  const [causeOfDeaths, setCauseOfDeaths] = useState(null);
  const [checkBoxUnderlying, setCheckBoxUnderlying] = useState("");
  const [flagUnderlying, setFlagUnderlying] = useState(false);

  const [underlyingSelections,setUnderlyingSelections] = useState([]);
  const [underlyingResult, setUnderlyingResult] = useState("");
  const [underlyingModal, setUnderlyingModal] = useState(false);
  const [timeToDeath, setTimeToDeath] = useState(null);
  const [timeToDeathModal, setTimeToDeathModal] = useState(false);

  const {
    currentEnrollment,
    currentTei: { attributes },
    currentEnrollment: { enrollmentDate: currentTeiDateOfDeath },
    currentEnrollment: { status: enrollmentStatus }
  } = data;
  const { programMetadata, formMapping, icd11Options, femaleCode, icdApi_clientToken, keyUiLocale } = metadata;
  const currentTeiSexAttributeValue = attributes[formMapping.attributes["sex"]];
  const currentTeiDateOfBirthAttributeValue = attributes[formMapping.attributes["dob"]];
  const currentTeiAgeAttributeValue = attributes[formMapping.attributes["age"]];

  const age = currentTeiAgeAttributeValue ? currentTeiAgeAttributeValue : Math.abs(
    moment(currentTeiDateOfDeath, "YYYY-MM-DD").diff(
      moment(currentTeiDateOfBirthAttributeValue, "YYYY-MM-DD"),
      "years",
      true
    )
  );
  const programStage = programMetadata.programStages.find(
    (ps) => ps.id === formMapping.programStage
  );
  const currentEvent = data.currentEvents.find((event) => {
    return event.programStage === formMapping.programStage;
  });
  const returnInitValue = (de) => {
    return currentEvent ? (currentEvent.dataValues[de] ? currentEvent.dataValues[de] : "") : "";
  };
  const isShowMaternalDeath = () => currentTeiSexAttributeValue === femaleCode && age >= 10;
  const isShowFetalOrInfantDeath = () => age <= 1;

  useEffect(() => {
    if (formMapping.sections.find(({name}) => name === "Fetal or infant death") && currentEvent && !isShowFetalOrInfantDeath()) {
      [
        formMapping.dataElements["multiple_pregnancies"],
        formMapping.dataElements["stillborn"],
        formMapping.dataElements["hours_newborn_survived"],
        formMapping.dataElements["birth_weight"],
        formMapping.dataElements["completedWeeks_pregnancy"],
        formMapping.dataElements["age_mother"],
        formMapping.dataElements["pregnancy_conditions"],
      ].map((deId) => {
        mutateDataValue(currentEvent.event, deId, "");
      });
      mutateEvent(currentEvent.event, "isDirty", false);
    }
  }, [age]);

  useEffect(() => {
    if (formMapping.sections.find(({name}) => name === "Maternal death") && currentEvent && !isShowMaternalDeath()) {
      [
        formMapping.dataElements["pregnancy_inLastYear"], 
        formMapping.dataElements["time_from_pregnancy"], 
        formMapping.dataElements["pregnancy_contributed_to_death"]
      ].map((deId) => {
        mutateDataValue(currentEvent.event, deId, "");
      });
      mutateEvent(currentEvent.event, "isDirty", false);
    }
  }, [currentTeiSexAttributeValue, age]);

  useEffect(() => {
    if (!currentEvent) {
      const eventId = generateCode();
      initNewEvent(eventId, programStage.id);
      mutateEvent(eventId, "eventDate", currentEnrollment.incidentDate);
      mutateEvent(eventId, "dueDate", currentEnrollment.incidentDate);

      // Dirty Check
      mutateEvent(eventId, "isDirty", false);
    }
    setUnderlyingResult(returnInitValue(formMapping.dataElements["underlyingCOD"]));
    const cods = {
      [formMapping.dataElements["codA"]]: {
        code: returnInitValue(formMapping.dataElements["codA"]),
        // label: returnInitValue(formMapping.dataElements["codA_name"]),
        underlying: returnInitValue(formMapping.dataElements["codA_underlying"]),
        entityId: returnInitValue(formMapping.dataElements["codA_entityId"])
      },
      [formMapping.dataElements["codB"]]: {
        code: returnInitValue(formMapping.dataElements["codB"]),
        // label: returnInitValue(formMapping.dataElements["codB_name"]),
        underlying: returnInitValue(formMapping.dataElements["codB_underlying"]),
        entityId: returnInitValue(formMapping.dataElements["codB_entityId"])
      },
      [formMapping.dataElements["codC"]]: {
        code: returnInitValue(formMapping.dataElements["codC"]),
        // label: returnInitValue(formMapping.dataElements["codC_name"]),
        underlying: returnInitValue(formMapping.dataElements["codC_underlying"]),
        entityId: returnInitValue(formMapping.dataElements["codC_entityId"])
      },
      [formMapping.dataElements["codD"]]: {
        code: returnInitValue(formMapping.dataElements["codD"]),
        // label: returnInitValue(formMapping.dataElements["codD_name"]),
        underlying: returnInitValue(formMapping.dataElements["codD_underlying"]),
        entityId: returnInitValue(formMapping.dataElements["codD_entityId"])
      },
      [formMapping.dataElements["codO"]]: {
        code: returnInitValue(formMapping.dataElements["codO"]),
        // label: returnInitValue(formMapping.dataElements["codO_name"]),
        underlying: returnInitValue(formMapping.dataElements["codO_underlying"]),
        entityId: returnInitValue(formMapping.dataElements["codO_entityId"])
      },
    };
    setCauseOfDeaths(cods);
  }, []);

  useEffect(() => {
    causeOfDeaths && setCheckBoxUnderlying(
      causeOfDeaths[formMapping.dataElements["codA"]].underlying
        ? formMapping.dataElements["codA_underlying"]
        : causeOfDeaths[formMapping.dataElements["codB"]].underlying
        ? formMapping.dataElements["codB_underlying"]
        : causeOfDeaths[formMapping.dataElements["codC"]].underlying
        ? formMapping.dataElements["codC_underlying"]
        : causeOfDeaths[formMapping.dataElements["codD"]].underlying
        ? formMapping.dataElements["codD_underlying"]
        : causeOfDeaths[formMapping.dataElements["codO"]].underlying
        ? formMapping.dataElements["codO_underlying"]
        : ""
    );
  }, [causeOfDeaths])

  useEffect(() => {
    setFlagUnderlying(!flagUnderlying);
  }, [checkBoxUnderlying])

  useEffect(() => {
    if ( causeOfDeaths ) {
      fillUpUnderlying(causeOfDeaths);
    }
  }, [flagUnderlying]);

  useEffect(() => {
    if ( underlyingResult !== "" ) {
      fillUpUnderlying(causeOfDeaths);
    }
  }, [underlyingResult]);

  const setValueIcdField = (cod) => {
    if (activeCauseOfDeath !== "") {
      mutateDataValue(currentEvent.event, activeCauseOfDeath.code, cod[activeCauseOfDeath.code].code);
      // mutateDataValue(currentEvent.event, activeCauseOfDeath.label, cod[activeCauseOfDeath.code].label);
      mutateDataValue(currentEvent.event, activeCauseOfDeath.underlying, cod[activeCauseOfDeath.code].underlying);
      mutateDataValue(currentEvent.event, activeCauseOfDeath.entityId, cod[activeCauseOfDeath.code].entityId);

      // RESET activeCauseOfDeath 
      setActiveCauseOfDeath("");
    }
  }

  const fillUpUnderlying = (cod) => {
    let result = null;
    // for (const [key, value] of Object.entries(cod)) {
    //   if (value.underlying) {
        result = underlyingResult;
    //   }
    // }

    const currentUnderlyingCoD = currentEvent && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_code"]] ? currentEvent.dataValues[formMapping.dataElements["underlyingCOD_code"]] : "";
    // Save values of underlying
    if (currentEvent) {
      if (result && result !== "") {
        if ( result !== currentUnderlyingCoD ) {
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD"], result);
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_code"], result);

          const foundOption = icd11Options.find(option => option.code === result);
          if (!foundOption) {
            console.error(`No matching option found for code: ${result}`);
            console.log(icd11Options, " icd11Options");
            return; // Exit early because the option is not found.
          }
          const chapterAttribute = foundOption.attributeValues?.find(attrVal => attrVal.attribute.id === formMapping.optionAttributes["chapter"]);
          const groupAttribute = foundOption.attributeValues?.find(attrVal => attrVal.attribute.id === formMapping.optionAttributes["group"]);
          if (!chapterAttribute || !groupAttribute){
            console.error(`Missing attribute in the matching options`);
            return;
          }

          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_code"], result);
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_chapter"], chapterAttribute.value);
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_group"], groupAttribute.value);

          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_chapter"], icd11Options.find( option => option.code === result).attributeValues.find( attrVal => attrVal.attribute.id === formMapping.optionAttributes["chapter"] ).value);
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_group"], icd11Options.find( option => option.code === result).attributeValues.find( attrVal => attrVal.attribute.id === formMapping.optionAttributes["group"] ).value);
        }
      } else {
        if (currentEvent.isDirty) {
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_code"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_chapter"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_group"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_report"], "");
        }
        else {
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_code"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_chapter"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_group"], "");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_report"], "");
          mutateEvent(currentEvent.event, "isDirty", false);
        }
        
      }
    }
  };

  // Render Inputs ( text, checkbox - note: not for code and label fields)
  const renderInputField = (de, extraFunction, placeholder) => {
    const foundDe = programStage.dataElements.find((dataElement) => dataElement.id === de);
    if(!foundDe){
      return null;
    }
    let disable = false;
    if (
      currentEvent 
      && de === formMapping.dataElements["reason_of_manual_COD_selection"]
      && (
        (currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] 
        && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] === "DORIS")
      || !currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] )
    ) {
      disable = true;
    }
    if (
      currentEvent 
      && de === formMapping.dataElements["underlyingCOD_processed_by"]
      && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] !== "Manual"
      && underlyingResult === ""
    ) {
      disable = true;
    }
    if (
      de === formMapping.dataElements["codA_underlying"] ||
      de === formMapping.dataElements["codB_underlying"] ||
      de === formMapping.dataElements["codC_underlying"] ||
      de === formMapping.dataElements["codD_underlying"] ||
      de === formMapping.dataElements["codO_underlying"]
    ) {
      if (checkBoxUnderlying !== "" && checkBoxUnderlying !== de) {
        disable = true;
      }
      if (currentEvent && !currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] && checkBoxUnderlying === "") {
        disable = true;
      }
      if (currentEvent && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] === "DORIS") {
        disable = true;
      }
    }
    return (
      <InputField
        value={currentEvent && currentEvent.dataValues[de] ? currentEvent.dataValues[de] : de === formMapping.dataElements["underlyingCOD_processed_by"] ? "DORIS" : ""}
        change={(value) => {
          // check if input is underlying checkbox
          if (extraFunction) {
            let currentCauseOfDeath = causeOfDeaths;
            let id = null;
            switch (de) {
              case formMapping.dataElements["codA_underlying"]:
                id = formMapping.dataElements["codA"];
                break;
              case formMapping.dataElements["codB_underlying"]:
                id = formMapping.dataElements["codB"];
                break;
              case formMapping.dataElements["codC_underlying"]:
                id = formMapping.dataElements["codC"];
                break;
              case formMapping.dataElements["codD_underlying"]:
                id = formMapping.dataElements["codD"];
                break;
              case formMapping.dataElements["codO_underlying"]:
                id = formMapping.dataElements["codO"];
                break;
              default:
                break;
            }
            
            // set underlying
            if (value) {
              if ( currentCauseOfDeath[id].code.split(",").length === 1 ) {
                setUnderlyingResult(currentCauseOfDeath[id].code);
              }
              else {
                setUnderlyingSelections(currentCauseOfDeath[id].code.split(",").map(selection => ({label: `${selection} - ${icd11Options.find(({code}) => code === selection.split(" (")[0])?.name}`, value: selection.split(" (")[0]})));
                setUnderlyingModal(true);
              }
            }
            else {
              setUnderlyingResult("");
              setUnderlyingSelections([]);
            }

            if (id) {
              for (const [key, val] of Object.entries(currentCauseOfDeath)) {
                if (key === id) {
                  val.underlying = value;
                } else {
                  val.underlying = false;
                }
              }
              
              setCauseOfDeaths({
                ...causeOfDeaths,
                ...currentCauseOfDeath
              });
            }

            
          }
          // set DORIS
          if (currentEvent && de === formMapping.dataElements["underlyingCOD_processed_by"] && value === "DORIS") {
            mutateDataValue(currentEvent.event, formMapping.dataElements["reason_of_manual_COD_selection"], "");
          }
          mutateDataValue(currentEvent.event, de, value);
        }}
        valueType={foundDe.valueType}
        // label={foundDe.displayFormName}
        valueSet={foundDe.valueSet}
        disabled={disable || enrollmentStatus === "COMPLETED"}
        placeholder={placeholder}
      />
    );
  };

  const tagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const option = icd11Options.find((item) => item.code === value.split(" (")[0]);
    const time = value.split(" (")[1]?.replace(")","");
    const timeString = !time ? "unknown" 
      : time[time.length - 1] === "Y" ? `${time.substring(1,time.length - 1)} year${parseInt(time.substring(1,time.length - 1)) === 1 ? "" : "s"}` 
      : time[time.length - 1] === "W" ? `${time.substring(1,time.length - 1)} week${parseInt(time.substring(1,time.length - 1)) === 1 ? "" : "s"}` 
      : time[time.length - 1] === "D" ? `${time.substring(1,time.length - 1)} day${parseInt(time.substring(1,time.length - 1)) === 1 ? "" : "s"}` 
      : time[time.length - 1] === "H" ? `${time.substring(2,time.length - 1)} hour${parseInt(time.substring(2,time.length - 1)) === 1 ? "" : "s"}` 
      : time[time.length - 1] === "S" ? `${time.substring(2,time.length - 1)} second${parseInt(time.substring(2,time.length - 1)) === 1 ? "" : "s"}`
      : time[time.length - 1] === "M" ? 
        ( time.substring(0,2) === "PT" ? 
          `${time.substring(2,time.length - 1)} minute${parseInt(time.substring(2,time.length - 1)) === 1 ? "" : "s"}`
          : `${time.substring(1,time.length - 1)} month${parseInt(time.substring(1,time.length - 1)) === 1 ? "" : "s"}` ) 
      : "unknown"

    return (
      <Tooltip title={`${option?.name}\n${timeString}`} overlayInnerStyle={{ whiteSpace: "pre-line" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#f0f0f0",
            padding: "4px 8px",
            borderRadius: "4px",
            margin: "2px",
          }}
        >
          {label}
          {closable && (
            <span
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              style={{
                marginLeft: "8px",
                cursor: "pointer",
                color: "#999",
              }}
            >
              ×
            </span>
          )}
        </span>
      </Tooltip>
    )
  }

  // const renderCauseOfDeathsInputField = (codCode, codName, codEntityId, codUnderlying) => {
  const renderCauseOfDeathsInputField = (codCode, codEntityId, codUnderlying) => {
    return (
      <InputField
        // addonBefore={
        //   currentEvent ? currentEvent.dataValues[codCode] ? <b>{currentEvent.dataValues[codCode]}</b> : "" : ""
        // }
        // value={currentEvent ? (currentEvent.dataValues[codCode] ? currentEvent.dataValues[codCode] : "") : ""}
        value={currentEvent ? (currentEvent.dataValues[codCode] ? currentEvent.dataValues[codCode].split(",") : []) : []}
        valueSet={currentEvent ? (currentEvent.dataValues[codCode] ? currentEvent.dataValues[codCode].split(",") : []) : []}
        selectMode={"multiple"}
        tagRender={tagRender}
        valueType="TEXT"
        click={() => {
          setActiveCauseOfDeath({
            // ...activeCauseOfDeath,
            // label: codName,
            code: codCode,
            entityId: codEntityId,
            underlying: codUnderlying,
            // freeText: freeText
          });
          setIcdTool(true);
        }}
        placeholder={"ICD-11 Coding Tool"}
        // allowClear={true}
        change={ value => {
          console.log(value);
          if ( value === "" ) {
            mutateDataValue(currentEvent.event, codCode, "");
            // mutateDataValue(currentEvent.event, codName, "");
            mutateDataValue(currentEvent.event, codUnderlying, false);
            causeOfDeaths[codCode].code = "";
            // causeOfDeaths[codCode].label = "";
            causeOfDeaths[codCode].underlying = false;
            setCauseOfDeaths({ ...causeOfDeaths });
          }

          let dataValues_codEntityId = currentEvent.dataValues[codEntityId].split(",");
          currentEvent.dataValues[codCode].split(",").forEach( (c,i) => {
            if ( !value.find( v => c === v ) ) {
              console.log(c,i);
              // dataValues_codEntityId = dataValues_codEntityId.splice(i,1);
              console.log(dataValues_codEntityId.splice(i,1));
            }
          })

          causeOfDeaths[formMapping.dataElements["codA"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codB"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codC"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codD"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codO"]].underlying = false;
          mutateDataValue(currentEvent.event, formMapping.dataElements["codA_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codB_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codC_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codD_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codO_underlying"], false);

          causeOfDeaths[codCode].code = value.join(",");
          causeOfDeaths[codCode].entityId = dataValues_codEntityId.join(",");
          mutateDataValue(currentEvent.event, codCode, value.join(","));
          mutateDataValue(currentEvent.event, codEntityId, dataValues_codEntityId.join(","));

          setCauseOfDeaths({ ...causeOfDeaths });
          setUnderlyingResult("");

          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_processed_by"], "DORIS");
        }}
        disabled={enrollmentStatus === "COMPLETED"}
      />
    );
  };

  // This works with the Maternal Death rule once the section has attribute "programRule" with value "MaternalDeath" in data store
  const renderOtherSection = section => {
    return section.programRule !== "MaternalDeath" || isShowMaternalDeath() ? <div className="stage-section">
        <div className="stage-section-title">{section.name}</div>
        <div className="stage-section-content">
          <table className="other-section-table">
            <tbody>
            {
              section.dataElements.map( ({id}) => <tr>
                <td>{programMetadata.programStages[0].dataElements.find( de => de.id === id ).displayFormName}</td>
                <td>
                  {renderInputField(id)}
                </td>
              </tr>)
            }
            </tbody>
          </table>
        </div>
      </div> : <></>
  }

  const detectUnderlyingCauseOfDeath = async () => {
    // const payload = {
    //   "DeathCertificate": {
    //     "CertificateKey": "",
    //     "Issuer": "",
    //     "Comments": "",
    //     "FreeText": "",
    //     "ICDVersion": "",
    //     "ICDMinorVersion": "",
    //     "UCStated": null,
    //     "UCComputed": {
    //       "RuleEngine": "",
    //       "Reject": null,
    //       "Validate": null,
    //       "Timestamp": "",
    //       "UC": null,
    //       "UCComplete": null,
    //       "Report": "",
    //       "Errors": "",
    //       "Warnings": ""
    //     },
    //     "AdministrativeData": {
    //         "DateBirth": currentTeiDateOfBirthAttributeValue ? moment(currentTeiDateOfBirthAttributeValue, "YYYY-MM-DD").format("ddd MMM DD YYYY") : "",
    //         "DateDeath": currentTeiDateOfDeath ? moment(currentTeiDateOfDeath, "YYYY-MM-DD").format("ddd MMM DD YYYY") : "",
    //         "Sex": !currentTeiSexAttributeValue ? 9 : currentTeiSexAttributeValue === "" ? 9 : currentTeiSexAttributeValue === femaleCode ? 2 : 1,
    //         "EstimatedAge": (currentTeiDateOfBirthAttributeValue && currentTeiDateOfDeath) ? `P${currentTeiAgeAttributeValue}Y` : ""
    //     },
    //     "Part1": [
    //         {
    //             "Conditions": currentEvent.dataValues[formMapping.dataElements["codA"]]?.split(",").map( codeSelection => ({
    //               "Code": codeSelection.split(" (")[0],
    //               "LinearizationURI": "",
    //               "Text": "",
    //               "FoundationURI": "",
    //               "Interval": codeSelection.split(" (")[1]?.replace(")","") ?? ""
    //             })) ?? []
    //         },
    //         {
    //             "Conditions": currentEvent.dataValues[formMapping.dataElements["codB"]]?.split(",").map( codeSelection => ({
    //               "Code": codeSelection.split(" (")[0],
    //               "LinearizationURI": "",
    //               "Text": "",
    //               "FoundationURI": "",
    //               "Interval": codeSelection.split(" (")[1]?.replace(")","") ?? ""
    //             })) ?? []
    //         },
    //         {
    //             "Conditions": currentEvent.dataValues[formMapping.dataElements["codC"]]?.split(",").map( codeSelection => ({
    //               "Code": codeSelection.split(" (")[0],
    //               "LinearizationURI": "",
    //               "Text": "",
    //               "FoundationURI": "",
    //               "Interval": codeSelection.split(" (")[1]?.replace(")","") ?? ""
    //             })) ?? []
    //         },
    //         {
    //             "Conditions": currentEvent.dataValues[formMapping.dataElements["codD"]]?.split(",").map( codeSelection => ({
    //               "Code": codeSelection.split(" (")[0],
    //               "LinearizationURI": "",
    //               "Text": "",
    //               "FoundationURI": "",
    //               "Interval": codeSelection.split(" (")[1]?.replace(")","") ?? ""
    //             })) ?? []
    //         },
    //         {
    //             "Conditions": []
    //         }
    //     ],
    //     "Part2": {
    //         "Conditions": currentEvent.dataValues[formMapping.dataElements["codO"]]?.split(",").map( codeSelection => ({
    //           "Code": codeSelection.split(" (")[0],
    //           "LinearizationURI": "",
    //           "Text": "",
    //           "FoundationURI": "",
    //           "Interval": codeSelection.split(" (")[1]?.replace(")","") ?? ""
    //         })) ?? []
    //     },
    //     "Surgery": {
    //         "WasPerformed": null,
    //         "Reason": "",
    //         "Date": ""
    //     },
    //     "Autopsy": {
    //         "WasRequested": null,
    //         "Findings": null
    //     },
    //     "MannerOfDeath": {
    //         "MannerOfDeath": null,
    //         "DateOfExternalCauseOrPoisoning": "",
    //         "DescriptionExternalCause": "",
    //         "PlaceOfOccuranceExternalCause": null
    //     },
    //     "FetalOrInfantDeath": {
    //         "MultiplePregnancy": null,
    //         "Stillborn": null,
    //         "DeathWithin24h": null,
    //         "BirthHeight": null,
    //         "PregnancyWeeks": null,
    //         "AgeMother": null,
    //         "PerinatalDescription": ""
    //     },
    //     "MaternalDeath": {
    //         "WasPregnant": null,
    //         "TimeFromPregnancy": null,
    //         "PregnancyContribute": null
    //     }
    //   },
    //   "DorisSettings": {
    //     "fullyAutomatic": true,
    //     "lang": keyUiLocale
    //   }
    // };

    // const result = await fetch("https://icd.who.int/doris/api/ucod/underlyingcauseofdeath/", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json"
    //   },
    //   body: payload
    // })
    // .then(response => response.json());
    // const underlyingCode = result.UCComputed.UCComplete?.code ?? "";

    let headers = new Headers();
    headers.append("accept", "application/json");
    headers.append("API-Version", "v2");
    headers.append("Accept-Language", keyUiLocale);
    headers.append("Authorization", `Bearer ${icdApi_clientToken}`);
    const icdApiUrl = "https://id.who.int/icd/release/11/2024-01/doris?"
      + "sex=" + (!currentTeiSexAttributeValue ? "9" : currentTeiSexAttributeValue === "" ? "9" : currentTeiSexAttributeValue === femaleCode ? "2" : "1")
      + (currentTeiAgeAttributeValue ? `&estimatedAge=P${currentTeiAgeAttributeValue}YD` : "")
      + (currentTeiDateOfBirthAttributeValue ? `&dateBirth=${currentTeiDateOfBirthAttributeValue}` : "")
      + (currentTeiDateOfDeath ? `&dateDeath=${currentTeiDateOfDeath}` : "")
      + ( "&causeOfDeathCodeA=" + causeOfDeaths[formMapping.dataElements["codA"]].code.split(",").map( c => c.split(" (")[0] ).join(","))
      + ( "&causeOfDeathCodeB=" + causeOfDeaths[formMapping.dataElements["codB"]].code.split(",").map( c => c.split(" (")[0] ).join(",")) 
      + ("&causeOfDeathCodeC=" + causeOfDeaths[formMapping.dataElements["codC"]].code.split(",").map( c => c.split(" (")[0] ).join(",")) 
      + ("&causeOfDeathCodeD=" + causeOfDeaths[formMapping.dataElements["codD"]].code.split(",").map( c => c.split(" (")[0] ).join(",")) 
      + ("&causeOfDeathCodeE=" + causeOfDeaths[formMapping.dataElements["codO"]].code.split(",").map( c => c.split(" (")[0] ).join(","));
    const result = await fetch(icdApiUrl, {
      headers: headers
    })
    .then((result) => {
      console.log("result here ");
      console.log("<br />");
      return result.json();
    })
    .catch((err) => {
      return err;
    });
    const underlyingCode = result.stemCode;

    if ( underlyingCode !== "" ) {
      const cods = {
        [formMapping.dataElements["codA"]]: {
          ...causeOfDeaths[formMapping.dataElements["codA"]],
          underlying: causeOfDeaths[formMapping.dataElements["codA"]].code.includes(underlyingCode),
        },
        [formMapping.dataElements["codB"]]: {
          ...causeOfDeaths[formMapping.dataElements["codB"]],
          underlying: causeOfDeaths[formMapping.dataElements["codB"]].code.includes(underlyingCode),
        },
        [formMapping.dataElements["codC"]]: {
          ...causeOfDeaths[formMapping.dataElements["codC"]],
          underlying: causeOfDeaths[formMapping.dataElements["codC"]].code.includes(underlyingCode),
        },
        [formMapping.dataElements["codD"]]: {
          ...causeOfDeaths[formMapping.dataElements["codD"]],
          underlying: causeOfDeaths[formMapping.dataElements["codD"]].code.includes(underlyingCode),
        },
        [formMapping.dataElements["codO"]]: {
          ...causeOfDeaths[formMapping.dataElements["codO"]],
          underlying: causeOfDeaths[formMapping.dataElements["codO"]].code.includes(underlyingCode),
        }
      };

      mutateDataValue(currentEvent.event, formMapping.dataElements["codA_underlying"], cods[formMapping.dataElements["codA"]].underlying);
      mutateDataValue(currentEvent.event, formMapping.dataElements["codB_underlying"], cods[formMapping.dataElements["codB"]].underlying);
      mutateDataValue(currentEvent.event, formMapping.dataElements["codC_underlying"], cods[formMapping.dataElements["codC"]].underlying);
      mutateDataValue(currentEvent.event, formMapping.dataElements["codD_underlying"], cods[formMapping.dataElements["codD"]].underlying);
      mutateDataValue(currentEvent.event, formMapping.dataElements["codO_underlying"], cods[formMapping.dataElements["codO"]].underlying);
      mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_report"], result.report);
      mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_warning"], result.warning ?? "");
      // mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_report"], result.UCComputed?.Report ?? result.UCComputed?.Errors ?? "");

      mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_processed_by"], "DORIS");
      mutateDataValue(currentEvent.event, formMapping.dataElements["reason_of_manual_COD_selection"], ""); // For clearing the value of reason for the manual selection

      mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_DORIS"], underlyingCode);

      setUnderlyingResult(underlyingCode);
      setCauseOfDeaths(cods);
    };
  }

  // const getUcodResult = () => currentEvent && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_report"]] ? currentEvent.dataValues[formMapping.dataElements["underlyingCOD_report"]] : t("note_WHO_digital_open_rule_integrated_cause_of_death_selection_Doris");


  return (
    <>
      <Modal 
        style={{ top: 250 }}
        closable={false}
        title="Select underlying cause of death" 
        open={underlyingModal} 
        footer={[
          <Button 
            onClick={() => {
              setUnderlyingModal(false);

            }}
            disabled={underlyingResult===""}
          >
            Close
          </Button>
        ]}
      >
        <InputField
          valueType="TEXT"
          valueSet={underlyingSelections}
          value={underlyingResult}
          change={selected => {
            setUnderlyingResult(selected);
          }}
        />
      </Modal>
      <Modal
        style={{ top: 250 }}
        closable={false}
        width={"40%"}
        title={`${timeToDeath?.causeLabel} - Time from onset to death`}
        open={timeToDeathModal}
        footer={[
          <Button
            type="primary"
            onClick={() => {
              mutateDataValue(
                currentEvent.event,
                timeToDeath.causeId,
                timeToDeath.timeInterval.reduce((accumulator, currentValue) => {
                  return accumulator === "" ? `${currentValue.code} (${currentValue.time})` : `${accumulator},${currentValue.code} (${currentValue.time})`
                }, "")
              );
              setTimeToDeathModal(false);
            }}
            style={{ width: "100px"}}
          >
            Set
          </Button>,
          <Button
            onClick={() => {
              setTimeToDeathModal(false);
            }}
            style={{ width: "100px"}}
          >
            Close
          </Button>
        ]}
      >
        <table width={"100%"}>
        {
          currentEvent && timeToDeath && timeToDeath.timeInterval.map( ({code, time}) => { 
              // const selection = code.split(" (")[0];
              // let selectionTime = code.split(" (")[1]?.replace(")","");

              return <tr>
              <td width={"50%"}>{`${code} - ${icd11Options.find((option) => option.code === code)?.name}`}</td>
              <td width={"25%"}>
                <InputField 
                  valueSet={[
                    {
                      label: "Years",
                      value: "year"
                    },
                    {
                      label: "Months",
                      value: "month"
                    },
                    {
                      label: "Weeks",
                      value: "week"
                    },
                    {
                      label: "Days",
                      value: "day"
                    },
                    {
                      label: "Hours",
                      value: "hour"
                    },
                    {
                      label: "Minutes",
                      value: "minute"
                    },
                    {
                      label: "Seconds",
                      value: "second"
                    },
                    {
                      label: "Unknown",
                      value: "unknown"
                    }
                  ]}
                  placeholder="Time unit"
                  valueType="TEXT"
                  change={ value => {
                    setTimeToDeath({
                      ...timeToDeath,
                      timeInterval: timeToDeath.timeInterval.map( t => {
                        if (t.code === code) {
                          return {
                            ...t,
                            time: value === "unknown" ? undefined : 
                              value === "year" ? `P${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}Y` : 
                              value === "month" ? `P${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}M` : 
                              value === "week" ? `P${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}W` : 
                              value === "day" ? `P${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}D` : 
                              value === "hour" ? `PT${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}H` : 
                              value === "minute" ? `PT${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}M` : 
                              value === "second" ? `PT${!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}S` : 
                              undefined
                          }
                        }
                        else return t;
                      })
                    })
                  }}
                  value={!time ? "unknown" : time[time.length - 1] === "Y" ? "year" : time[time.length - 1] === "W" ? "week" : time[time.length - 1] === "D" ? "day" : time[time.length - 1] === "H" ? "hour" : time[time.length - 1] === "S" ? "second" : time[time.length - 1] === "M" ? (time.substring(0,2) === "PT" ? "minute" : "month") : "unknown"}
                />
              </td>
              <td width={"25%"}>
                <InputField 
                  valueType="INTEGER_POSITIVE"
                  placeholder="Time interval"
                  change={ value => {
                    setTimeToDeath({
                      ...timeToDeath,
                      timeInterval: timeToDeath.timeInterval.map( t => {
                        if (t.code === code) {
                          return {
                            ...t,
                            time: !time ? undefined :  time.substring(0,2) === "PT" ? `PT${value}${time[time.length - 1]}` : `P${value}${time[time.length - 1]}`
                          }
                        }
                        else return t;
                      })
                    })
                  }}
                  value={!time ? "" : time.substring(0,2) === "PT" ? time.substring(2,time.length - 1) : time.substring(1,time.length - 1)}
                />
              </td>
            </tr>
          })
        }
        </table>
      </Modal>
      <Icd11Tool
        visible={icdTool}
        setVisible={setIcdTool}
        onSelect={(cod) => {
          const selectedCod = {
            code: cod.code,
            // label: cod.title
            //   .replace(/<em class='found'>/g, "")
            //   .replace(/<em class='nonwbe'>/g, "")
            //   .replace(/<[/]em>/g, ""),
            uri: cod.foundationUri
          };
          causeOfDeaths[activeCauseOfDeath.code].code = causeOfDeaths[activeCauseOfDeath.code].code === "" ? selectedCod.code : `${causeOfDeaths[activeCauseOfDeath.code].code},${selectedCod.code}`;
          // causeOfDeaths[activeCauseOfDeath.code].label = selectedCod.label;
          causeOfDeaths[formMapping.dataElements["codA"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codB"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codC"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codD"]].underlying = false;
          causeOfDeaths[formMapping.dataElements["codO"]].underlying = false;
          mutateDataValue(currentEvent.event, formMapping.dataElements["codA_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codB_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codC_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codD_underlying"], false);
          mutateDataValue(currentEvent.event, formMapping.dataElements["codO_underlying"], false);
          causeOfDeaths[activeCauseOfDeath.code].entityId = causeOfDeaths[activeCauseOfDeath.code].entityId === "" ? selectedCod.uri.split("/")[selectedCod.uri.split("/").length - 1] : `${causeOfDeaths[activeCauseOfDeath.code].entityId},${selectedCod.uri.split("/")[selectedCod.uri.split("/").length - 1]}`;
          setValueIcdField(causeOfDeaths);
          setCauseOfDeaths({ ...causeOfDeaths });
          setUnderlyingResult("");
          mutateDataValue(currentEvent.event, formMapping.dataElements["underlyingCOD_processed_by"], "DORIS");
        }}
        defaultValue={{
          // title: (currentEvent && currentEvent.dataValues[activeCauseOfDeath.label]) || "",
          // code: (currentEvent && currentEvent.dataValues[activeCauseOfDeath.code]) || ""
          title: "",
          code: ""
        }}
        // freeText={(currentEvent && currentEvent.dataValues[activeCauseOfDeath.freeText]) || ""}
      />
      <div>
        {/* <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Frame A" key="a"> */}
            {/* <div className="tab-container"> */}
              <div className="stage-section">
                <div className="stage-section-title">{t("medicalData")}</div>
                <div className="stage-section-content">
                  <table className="medical-data-table">
                    <tbody>
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            fontWeight: "bold",
                            textAlign: "left",
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                        {
                          t("reasonLeadingToDeath")
                        }
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: "90%" }}>
                        {t("causeOfDeath")}
                        </td>
                        {/* <td>{t("timeFromOnsetToDeath")}</td> */}
                        <td>{t("underlying")}</td>
                      </tr>
                      <tr>
                        {/* <td>{t("immediate")}</td>
                        <td>A</td> */}
                        <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codA_other_name"],undefined,"A (Free Text)")}
                            {renderCauseOfDeathsInputField(
                              formMapping.dataElements["codA"],
                              // formMapping.dataElements["codA_name"],
                              formMapping.dataElements["codA_entityId"],
                              formMapping.dataElements["codA_underlying"],
                              formMapping.dataElements["codA_other_name"]
                            )}
                            <Button
                              style={{
                                width: "20%",
                                margin: "5px"
                              }}
                              disabled={!currentEvent?.dataValues[formMapping.dataElements["codA"]]}
                              onClick={ () => {
                                setTimeToDeathModal(true);
                                setTimeToDeath({
                                  causeId: formMapping.dataElements["codA"],
                                  causeLabel: "Cause of Death A",
                                  timeInterval: currentEvent.dataValues[formMapping.dataElements["codA"]].split(",").map( codeSelection => { 
                                    return {
                                      code: codeSelection.split(" (")[0],
                                      time: codeSelection.split(" (")[1]?.replace(")","")
                                    }
                                  })
                                });
                              }}
                            >{t("timeFromOnsetToDeath")}</Button>
                          </div>
                        </td>
                        {/* <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codA_time"])}
                            {renderInputField(formMapping.dataElements["codA_periodType"])}
                          </div>
                        </td> */}
                        <td>{renderInputField(formMapping.dataElements["codA_underlying"], "underlying")}</td>
                      </tr>
                      <tr>
                        <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codB_other_name"],undefined,"B (Free Text)")}
                            {renderCauseOfDeathsInputField(
                              formMapping.dataElements["codB"],
                              // formMapping.dataElements["codB_name"],
                              formMapping.dataElements["codB_entityId"],
                              formMapping.dataElements["codB_underlying"],
                              formMapping.dataElements["codB_other_name"]
                            )}
                            <Button
                              style={{
                                width: "20%",
                                margin: "5px"
                              }}
                              disabled={!currentEvent?.dataValues[formMapping.dataElements["codB"]]}
                              onClick={ () => {
                                setTimeToDeathModal(true);
                                setTimeToDeath({
                                  causeId: formMapping.dataElements["codB"],
                                  causeLabel: "Cause of Death B",
                                  timeInterval: currentEvent.dataValues[formMapping.dataElements["codB"]].split(",").map( codeSelection => { 
                                    return {
                                      code: codeSelection.split(" (")[0],
                                      time: codeSelection.split(" (")[1]?.replace(")","")
                                    }
                                  })
                                });
                              }}
                            >{t("timeFromOnsetToDeath")}</Button>
                          </div>
                        </td>
                        {/* <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codB_time"])}
                            {renderInputField(formMapping.dataElements["codB_periodType"])}
                          </div>
                        </td> */}
                        <td>{renderInputField(formMapping.dataElements["codB_underlying"], "underlying")}</td>
                      </tr>
                      <tr>
                        {/* <td>{t("dueTo")}</td>
                        <td>C</td> */}
                        <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codC_other_name"],undefined,"C (Free Text)")}
                            {/* {renderInputField(formMapping.dataElements["codC_other_name"])} */}
                            {renderCauseOfDeathsInputField(
                              formMapping.dataElements["codC"],
                              // formMapping.dataElements["codC_name"],
                              formMapping.dataElements["codC_entityId"],
                              formMapping.dataElements["codC_underlying"],
                              formMapping.dataElements["codC_other_name"]
                            )}
                            <Button
                              style={{
                                width: "20%",
                                margin: "5px"
                              }}
                              disabled={!currentEvent?.dataValues[formMapping.dataElements["codC"]]}
                              onClick={ () => {
                                setTimeToDeathModal(true);
                                setTimeToDeath({
                                  causeId: formMapping.dataElements["codC"],
                                  causeLabel: "Cause of Death C",
                                  timeInterval: currentEvent.dataValues[formMapping.dataElements["codC"]].split(",").map( codeSelection => { 
                                    return {
                                      code: codeSelection.split(" (")[0],
                                      time: codeSelection.split(" (")[1]?.replace(")","")
                                    }
                                  })
                                });
                              }}
                            >{t("timeFromOnsetToDeath")}</Button>
                          </div>
                        </td>
                        {/* <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codC_time"])}
                            {renderInputField(formMapping.dataElements["codC_periodType"])}
                          </div>
                        </td> */}
                        <td>{renderInputField(formMapping.dataElements["codC_underlying"], "underlying")}</td>
                      </tr>
                      <tr>
                        {/* <td>{t("dueTo")}</td>
                        <td>D</td> */}
                        <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codD_other_name"],undefined,"D (Free Text)")}
                            {/* {renderInputField(formMapping.dataElements["codD_other_name"])} */}
                            {renderCauseOfDeathsInputField(
                              formMapping.dataElements["codD"],
                              // formMapping.dataElements["codD_name"],
                              formMapping.dataElements["codD_entityId"],
                              formMapping.dataElements["codD_underlying"],
                              formMapping.dataElements["codD_other_name"]
                            )}
                            <Button
                              style={{
                                width: "20%",
                                margin: "5px"
                              }}
                              disabled={!currentEvent?.dataValues[formMapping.dataElements["codD"]]}
                              onClick={ () => {
                                setTimeToDeathModal(true);
                                setTimeToDeath({
                                  causeId: formMapping.dataElements["codD"],
                                  causeLabel: "Cause of Death D",
                                  timeInterval: currentEvent.dataValues[formMapping.dataElements["codD"]].split(",").map( codeSelection => { 
                                    return {
                                      code: codeSelection.split(" (")[0],
                                      time: codeSelection.split(" (")[1]?.replace(")","")
                                    }
                                  })
                                });
                              }}
                            >{t("timeFromOnsetToDeath")}</Button>
                          </div>
                        </td>
                        {/* <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codD_time"])}
                            {renderInputField(formMapping.dataElements["codD_periodType"])}
                          </div>
                        </td> */}
                        <td>{renderInputField(formMapping.dataElements["codD_underlying"], "underlying")}</td>
                      </tr>
                      <tr>
                        {/* <td>{t("dueTo")}</td>
                        <td>D</td> */}
                        <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codO_other_name"],undefined,"Other significant conditions contributing to death")}
                            {/* {renderInputField(formMapping.dataElements["codD_other_name"])} */}
                            {renderCauseOfDeathsInputField(
                              formMapping.dataElements["codO"],
                              // formMapping.dataElements["codO_name"],
                              formMapping.dataElements["codO_entityId"],
                              formMapping.dataElements["codO_underlying"],
                              formMapping.dataElements["codO_other_name"]
                            )}
                            <Button
                              style={{
                                width: "20%",
                                margin: "5px"
                              }}
                              disabled={!currentEvent?.dataValues[formMapping.dataElements["codO"]]}
                              onClick={ () => {
                                setTimeToDeathModal(true);
                                setTimeToDeath({
                                  causeId: formMapping.dataElements["codO"],
                                  causeLabel: "Other Cause of Death",
                                  timeInterval: currentEvent.dataValues[formMapping.dataElements["codO"]].split(",").map( codeSelection => { 
                                    return {
                                      code: codeSelection.split(" (")[0],
                                      time: codeSelection.split(" (")[1]?.replace(")","")
                                    }
                                  })
                                });
                              }}
                            >{t("timeFromOnsetToDeath")}</Button>
                          </div>
                        </td>
                        {/* <td>
                          <div className="two-fields-container">
                            {renderInputField(formMapping.dataElements["codO_time"])}
                            {renderInputField(formMapping.dataElements["codO_periodType"])}
                          </div>
                        </td> */}
                        <td>{renderInputField(formMapping.dataElements["codO_underlying"], "underlying")}</td>
                      </tr>
                      {/* <tr>
                        <td
                          colSpan="5"
                          style={{
                            fontWeight: "bold",
                            textAlign: "left",
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                        {
                          t("otherReasonLeadingToDeath")
                        }
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="5">{renderInputField(formMapping.dataElements["codOther"])}</td>
                      </tr> */}

                      <tr>
                        <td
                          // colSpan="2"
                          style={{
                            // fontWeight: "bold",
                            backgroundColor: "#f5f5f5",
                            textAlign: "right",
                          }}>
                          <strong>Underlying Cause of Death processed by:</strong> </td>
                        <td
                          style={{
                            // fontWeight: "bold",
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                          {renderInputField(formMapping.dataElements["underlyingCOD_processed_by"])}
                        </td>
                      </tr>
                      <tr>
                      <td
                          // colSpan="2"
                          style={{
                            // fontWeight: "bold",
                            textAlign: "right",
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                          <strong>DORIS tool:</strong>
                        </td>
                        <td
                          style={{
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                          <Button
                            onClick={() => {
                              detectUnderlyingCauseOfDeath();
                            }}
                            disabled={(currentEvent 
                              && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] 
                              && currentEvent.dataValues[formMapping.dataElements["underlyingCOD_processed_by"]] === "Manual") || enrollmentStatus === "COMPLETED"}
                          > 
                          {t("compute")}
                          </Button>
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan="2"
                          style={{
                            // fontWeight: "bold",
                            textAlign: "right",
                            backgroundColor: "#f5f5f5"
                          }}
                        >
                          Reason for Manual Code: 
                          {renderInputField(formMapping.dataElements["reason_of_manual_COD_selection"])}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* <div className="stage-section">
                <div className="stage-section-title">{t("results")}</div>
                <div className="stage-section-content">
                  <table className="results-table">
                    <tbody>
                      <tr>
                        <td>{t("icd11")}</td>
                        <td className="unselectable-field">
                          {renderInputField(formMapping.dataElements["underlyingCOD_code"])}
                        </td>
                      </tr>
                      <tr>
                        <td>{t("underlyingCOD")}</td>
                        <td className="unselectable-field">
                          {renderInputField(formMapping.dataElements["underlyingCOD"])}
                        </td>
                      </tr>
                      <tr>
                        <td>{t("icd11Chapter")}</td>
                        <td className="unselectable-field">
                          {renderInputField(formMapping.dataElements["underlyingCOD_chapter"])}
                        </td>
                      </tr>
                      <tr hidden="hidden">
                        <td>{t("icd11Grouping")}</td>
                        <td className="unselectable-field">
                          {renderInputField(formMapping.dataElements["underlyingCOD_group"])}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="results-compute">
                    <p>
                      <Button onClick={() => detectUnderlyingCauseOfDeath()}>{
                        t("compute")
                      }</Button> 
                    </p>
                    <p>
                      <Button onClick={() => detectUnderlyingCauseOfDeath()}>{
                        t("compute")
                      }</Button> 
                    </p>
                    <div><pre>{getUcodResult()}</pre></div>
                  </div>
                </div>
              </div> */}
              {formMapping.otherSections.frameA && formMapping.otherSections.frameA.map( section => renderOtherSection(section) )}
            {/* </div> */}
          {/* </TabPane>
          <TabPane tab="Frame B" key="b"> */}
            {/* <div className="tab-container"> */}
              {formMapping.sections.find(({name}) => name === "Surgery") && (<div className="stage-section">
                <div className="stage-section-title">{t("surgery")}</div>
                <div className="stage-section-content">
                  <table className="surgery-table">
                    <tbody>
                      <tr>
                        <td>{t("surgeryWithin4months")}</td>
                        <td>{renderInputField(formMapping.dataElements["surgery"])}</td>
                        <td>{t("surgeryDate")}</td>
                        <td>{renderInputField(formMapping.dataElements["surgery_date"])}</td>
                      </tr>
                      <tr>
                        <td colSpan="1">
                        {
                          t("surgeryReason")
                        }
                        </td>
                        <td colSpan="3">{renderInputField(formMapping.dataElements["surgery_reason"])}</td>
                      </tr>
                      <tr>
                        <td>{t("autopsy")}</td>
                        <td>{renderInputField(formMapping.dataElements["autopsy"])}</td>
                        <td>
                        {
                          t("findings")
                        }
                        </td>
                        <td>{renderInputField(formMapping.dataElements["autopsy_specified"])}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>)}
              {formMapping.sections.find(({name}) => name === "Manner of death") && (<div className="stage-section">
                <div className="stage-section-title">{t("mannerOfDeath")}</div>
                <div className="stage-section-content">
                  <table className="manner-death-table">
                    <tbody>
                      <tr>
                        <td>{t("mannerOfDeath")}</td>
                        <td>{renderInputField(formMapping.dataElements["mannerOfDeath"])}</td>
                      </tr>
                      <tr>
                        <td>{t("posisoning")}</td>
                        <td>{renderInputField(formMapping.dataElements["dateOfInjury"])}</td>
                      </tr>
                      <tr>
                        <td>{t("describe")}</td>
                        <td>{renderInputField(formMapping.dataElements["externalCause"])}</td>
                      </tr>
                      <tr>
                        <td>{t("occurrencePlace")}</td>
                        <td>{renderInputField(formMapping.dataElements["externalCause_place"])}</td>
                      </tr>
                      <tr>
                        <td>{t("occurrenceSpecifyPlace")}</td>
                        <td>{renderInputField(formMapping.dataElements["externalCause_specifiedPlace"])}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>)}
              {(formMapping.sections.find(({name}) => name === "Fetal or infant death") && isShowFetalOrInfantDeath()) && (<div className="stage-section">
                <div className="stage-section-title">{t("fetalOrInfantDeath")}</div>
                <div className="stage-section-content">
                  <table className="infant-death-table">
                    <tbody>
                      <tr>
                        <td>{t("pregnant")}</td>
                        <td>{renderInputField(formMapping.dataElements["multiple_pregnancies"])}</td>
                        <td>{t("stillborn")}</td>
                        <td>{renderInputField(formMapping.dataElements["stillborn"])}</td>
                      </tr>
                      <tr>
                        <td>{t("hoursSurvived")}</td>
                        <td>{renderInputField(formMapping.dataElements["hours_newborn_survived"])}</td>
                        <td>{t("birthWeight")}</td>
                        <td>{renderInputField(formMapping.dataElements["birth_weight"])}</td>
                      </tr>
                      <tr>
                        <td>{t("pregnantWeeks")}</td>
                        <td>{renderInputField(formMapping.dataElements["completedWeeks_pregnancy"])}</td>
                        <td>{t("motherAge")}</td>
                        <td>{renderInputField(formMapping.dataElements["age_mother"])}</td>
                      </tr>
                      <tr>
                        <td colSpan="1">{t("perinatal")}</td>
                        <td colSpan="3">{renderInputField(formMapping.dataElements["pregnancy_conditions"])}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>)}
              {(formMapping.sections.find(({name}) => name === "Maternal death") && isShowMaternalDeath()) && (<div className="stage-section">
                <div className="stage-section-title">{t("maternal")}</div>
                <div className="stage-section-content">
                  <table className="maternal-death-table">
                    <tbody>
                      <tr>
                        <td>{t("pregnancyLastYear")}</td>
                        <td>{renderInputField(formMapping.dataElements["pregnancy_inLastYear"])}</td>
                      </tr>
                      <tr>
                        <td>{t("timePregnancy")}</td>
                        <td>{renderInputField(formMapping.dataElements["time_from_pregnancy"])}</td>
                      </tr>
                      <tr>
                        <td>{t("pregnancyToDeath")}</td>
                        <td>{renderInputField(formMapping.dataElements["pregnancy_contributed_to_death"])}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>)}
              {formMapping.otherSections.frameB && formMapping.otherSections.frameB.map( section => renderOtherSection(section) )}
              {formMapping.otherSections.form && formMapping.otherSections.form.map( section => renderOtherSection(section) )}
            {/* </div> */}
          {/* </TabPane>
        </Tabs> */}
        {/* <div className="stage-save-button-container">
          <ButtonGroup>
            <Button
              type="primary"
              onClick={async () => {
                setLoading(true);
                const { currentEvents } = generateDhis2Payload(data, programMetadata);
                await dataApi.pushEvents({ events: currentEvents });

                // Dirty Check
                mutateEvent(currentEvents[0].event,"isDirty",false);

                // Notification
                setLoading(false);
                message.success("Saved Successfully!");
              }}
            >
            {
              t("save")
            }
            </Button>
            <Button
              onClick={async () => {
                setLoading(true);
                const { currentEvents } = generateDhis2Payload(data, programMetadata);
                mutateEvent(currentEvents[0].event,"dataValues",{});
                setLoading(false);
              }}
            >{
              t("clear")
            }</Button>
          </ButtonGroup>
        </div> */}
      </div>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    metadata: state.metadata,
    data: state.data
  };
};
const mapDispatchToProps = { mutateEvent, mutateDataValue, initNewEvent };

export default connect(mapStateToProps, mapDispatchToProps)(Stage);
