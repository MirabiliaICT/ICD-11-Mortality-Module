import { useEffect } from "react";
import InputField from "../InputField";
import { Col, Row, message } from "antd";
import moment from "moment";
/* REDUX */
import { connect } from "react-redux";
import {
  mutateTei,
  mutateAttribute,
  mutateEnrollment,
  mutateEvent,
} from "../../redux/actions/data";

import { useTranslation } from "react-i18next";

/*       */
import { Hooks } from "tracker-capture-app-core";

const { useApi } = Hooks;
const Profile = ({
  mutateAttribute,
  mutateEnrollment,
  mutateEvent,
  metadata,
  data,
}) => {
  const { t } = useTranslation();
  const { metadataApi } = useApi();
  const { currentTei, currentEnrollment, currentEvents, currentEnrollment: { status: enrollmentStatus } } = data;
  const { programMetadata, formMapping, fullnameOption } = metadata;


  useEffect(() => {
    if ( getTeaValue(formMapping.attributes["system_id"]) === "" ) {
      metadataApi.get(`/api/trackedEntityAttributes/${formMapping.attributes["system_id"]}/generate.json`)
      .then(res => {
        mutateAttribute(formMapping.attributes["system_id"], res.value);
      });
    }
  },[]);

  useEffect(() => {
    if ( currentEnrollment["enrollmentDate"] && currentEnrollment["incidentDate"] ) {
      if ( currentEnrollment["enrollmentDate"] < currentEnrollment["incidentDate"] ) {
        message.error("ERROR!!! Reported Date must be greater than incidentDate")
      }
    }
  }, [data])

  const getTeaMetadata = (attribute) =>{
    programMetadata.trackedEntityAttributes.find(
      (tea) => tea.id === attribute
    );


    console.log(getTeaMetadata  + " Gertting pprogram Metadata ---" + attribute);

  }
    


  const getTeaValue = (attribute) => currentTei.attributes[attribute] ? currentTei.attributes[attribute] : "";



  // const populateInputField = attribute => {
  //   const tea = getTeaMetadata(attribute);
  //   const value = getTeaValue(attribute);
    
  //   return (
  //     <InputField
  //       value={ value }
  //       valueType={tea.valueType}
  //       label={tea.displayFormName}
  //       valueSet={tea.valueSet}
  //       change={(value) => {
  //         mutateAttribute(tea.id, value);
  //       }}
  //       disabled={attribute === formMapping.attributes["system_id"] || enrollmentStatus === "COMPLETED"}
  //       mandatory={tea.compulsory}
  //     />
  //   );
  // };

  const populateInputField = attribute => {
    const tea = getTeaMetadata(attribute);
    const value = getTeaValue(attribute);
    
    // Guard clause for when tea metadata is not found
    if (!tea) {
      console.warn(`Tea metadata not found for attribute: ${attribute}`);
      return null;
    }
  
    return (
      <InputField
        value={value}
        valueType={tea.valueType || 'TEXT'} // Provide default value type
        label={tea.displayFormName || attribute} // Use attribute as fallback label
        valueSet={tea.valueSet}
        change={(value) => {
          if (tea.id) {
            mutateAttribute(tea.id, value);
          } else {
            console.warn(`Cannot mutate attribute: tea.id is undefined for ${attribute}`);
          }
        }}
        disabled={attribute === formMapping.attributes["system_id"] || enrollmentStatus === "COMPLETED"}
        mandatory={Boolean(tea.compulsory)}
      />
    );
  };

  /*
  const hasUnderlying = () => {
    const currentEvent = data.currentEvents.find((event) => {
      return event.programStage === formMapping.programStage;
    });
    return (
      currentEvent &&
      currentEvent.dataValues &&
      currentEvent.dataValues[formMapping.dataElements["underlyingCOD"]]
    );
  };
  */

  const renderDOBGroup = () => {
    const dob = getTeaMetadata(formMapping.attributes["dob"]);
    const age = getTeaMetadata(formMapping.attributes["age"]);
    const isEstimated = getTeaMetadata(formMapping.attributes["estimated_dob"]);
  
    // Guard clause for when any required tea metadata is not found
    if (!dob || !age || !isEstimated) {
      console.warn('Missing required metadata:', {
        dob: !!dob,
        age: !!age,
        isEstimated: !!isEstimated
      });
      return null;
    }
  
    const calculateAge = (dateOfBirth) => {
      if (!dateOfBirth) return "";
      
      const age = parseInt(
        moment(currentEnrollment.incidentDate, "YYYY-MM-DD").diff(
          moment(dateOfBirth, "YYYY-MM-DD"),
          "years",
          true
        )
      );
  
      if (isNaN(age)) return "";
      if (age > 150) {
        message.error("Age can't be greater than 150");
        return "";
      }
      if (age < 0) {
        message.error("Age can't be negative number");
        return "";
      }
      
      return age.toString();
    };
  
    const handleAgeChange = (value) => {
      if (value === "") {
        mutateAttribute(age.id, "");
        return;
      }
  
      const numericAge = parseInt(value);
      if (numericAge > 150) {
        message.error("Age can't be greater than 150");
      } else if (numericAge < 0) {
        message.error("Age can't be negative number");
      } else {
        mutateAttribute(age.id, value);
      }
    };
  
    return (
      <>
        <Row justify="start" align="middle">
          <Col>
            <InputField
              value={getTeaValue(formMapping.attributes["estimated_dob"])}
              valueType={isEstimated.valueType}
              valueSet={isEstimated.valueSet}
              change={(value) => {
                mutateAttribute(isEstimated.id, value);
              }}
              disabled={enrollmentStatus === "COMPLETED"}
            />
          </Col>
          <Col>
            <div className="input-label">
              {`${isEstimated.displayFormName}${isEstimated.compulsory ? " *" : ""}`}
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <InputField
              value={getTeaValue(formMapping.attributes["dob"])}
              valueType="DATE_WITH_RANGE"
              label={dob.displayFormName}
              valueSet={dob.valueSet}
              change={(value) => {
                mutateAttribute(dob.id, value);
                const calculatedAge = calculateAge(value);
                if (calculatedAge !== "") {
                  mutateAttribute(age.id, calculatedAge);
                }
              }}
              disabledDate={current => current && current >= moment().startOf('day')}
              disabled={enrollmentStatus === "COMPLETED"}
              mandatory={dob.compulsory}
            />
          </Col>
          <Col>
            <InputField
              value={getTeaValue(formMapping.attributes["age"])}
              valueType={age.valueType}
              label={age.displayFormName}
              change={handleAgeChange}
              disabled={enrollmentStatus === "COMPLETED"}
              mandatory={age.compulsory}
            />
          </Col>
        </Row>
      </>
    );
  };

  // const renderDOBGroup = () => {
  //   const dob = getTeaMetadata(formMapping.attributes["dob"]);
  //   const age = getTeaMetadata(formMapping.attributes["age"]);
  //   const isEstimated = getTeaMetadata(formMapping.attributes["estimated_dob"]);

  //   // Guard clause for when tea metadata is not found
  //   if (!isEstimated) {
  //     console.warn(`Tea metadata not found for attribute: ${attribute}`);
  //     return null;
  //   }
  //   return (
  //     <>
  //       <Row justify="start" align="middle">
  //         <Col>
  //           <InputField
  //             value={getTeaValue(formMapping.attributes["estimated_dob"])}
  //             valueType={isEstimated.valueType}
  //             // label={}
  //             valueSet={isEstimated.valueSet}
  //             change={(value) => {
  //               mutateAttribute(isEstimated.id, value);
  //             }}
  //             disabled={enrollmentStatus === "COMPLETED"}
  //           />
  //         </Col>
  //         <Col>
  //           <div className="input-label">{`${isEstimated.displayFormName}${isEstimated.compulsory ? " *" : ""}`}</div>
  //         </Col>
  //       </Row>
  //       <Row>
  //         <Col>
  //           <InputField
  //             value={getTeaValue(formMapping.attributes["dob"])}
  //             // valueType={dob.valueType}
  //             valueType={"DATE_WITH_RANGE"}
  //             label={dob.displayFormName}
  //             valueSet={dob.valueSet}
  //             change={(value) => {
  //               console.log(value)
  //               mutateAttribute(dob.id, value);
  //               const age_cal = parseInt(moment(currentEnrollment.incidentDate, "YYYY-MM-DD").diff(
  //                 moment(getTeaValue(formMapping.attributes["dob"]), "YYYY-MM-DD"),
  //                 "years",
  //                 true
  //               ));
  //               if (age_cal > 150) 
  //                 message.error("Age can't be greater than 150")
  //               else if (age_cal < 0)
  //                 message.error("Age can't be negative number")
  //               else if (!isNaN(age_cal))
  //                 mutateAttribute(age.id, age_cal + "");
  //             }}
  //             disabledDate={current => current && current >= moment().startOf('day')}
  //             disabled={enrollmentStatus === "COMPLETED"}
  //             mandatory={dob.compulsory}
  //           />
  //         </Col>
  //         <Col>
  //           <InputField
  //             value={getTeaValue(formMapping.attributes["age"])}
  //             valueType={age.valueType}
  //             label={age.displayFormName}
  //             change={(value) => {
  //               if ( value !== "" ) {
  //                 (parseInt(value) > 150) ?
  //                 message.error("Age can't be greater than 150")
  //                 : (parseInt(value) < 0) ? 
  //                   message.error("Age can't be negative number")
  //                   : mutateAttribute(age.id, value);
  //               }
  //               else {
  //                 mutateAttribute(age.id, "");
  //               }
  //             }}
  //             disabled={enrollmentStatus === "COMPLETED"}
  //             mandatory={age.compulsory}
  //           />
  //         </Col>
  //       </Row>
  //     </>
  //   );
  // };

  return (
    <div>
      {/* <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop> */}
      {/* <WarningDialog 
        open={exitWarning}
        handleCancel={() => {
          setExitWarning(false);
        }}
        handleOk={() => {
          mutateTei("isDirty", false);
          mutateEnrollment("isDirty", false);
          mutateEvent(currentEvents[0].event, "isDirty", false);
          changeRoute("list");
        }}
      ></WarningDialog> */}
      <InputField
        value={currentEnrollment.enrollmentDate || ""}
        label={t("reportedDate")}
        valueType={"DATE_WITH_RANGE"}
        disabledDate={current => current && current > moment().endOf('day')}
        change={(value) => {
          mutateEnrollment("enrollmentDate", value);
        }}
        disabled={enrollmentStatus === "COMPLETED"}
        mandatory={true}
      />
      <InputField
        value={currentEnrollment.incidentDate || ""}
        label={t("incidentDate")}
        valueType={"DATE_WITH_RANGE"}
        disabledDate={current => current && current > moment().endOf('day')}
        change={(value) => {
          mutateEnrollment("incidentDate", value);
          currentEvents.forEach((event) => {
            mutateEvent(event.event, "eventDate", value);
            mutateEvent(event.event, "dueDate", value);
          });
        }}
        disabled={enrollmentStatus === "COMPLETED"}
        mandatory={true}
      />
      {/* {attributes
        .slice(0, 3)
        .map((attribute) => populateInputField(attribute))} */}
      {populateInputField(formMapping.attributes["system_id"])}
      {fullnameOption !== "noname" && populateInputField(formMapping.attributes["given_name"])}
      {fullnameOption === "firstmidlastname" && populateInputField(formMapping.attributes["middle_name"])}
      {(fullnameOption !== "noname" && fullnameOption !== "fullname") && populateInputField(formMapping.attributes["family_name"])}
      {renderDOBGroup()}
      {/* {attributes.slice(3).map((attribute) => populateInputField(attribute))} */}
      {populateInputField(formMapping.attributes["sex"])}
      {populateInputField(formMapping.attributes["address"])}


      {/* For other attributes */}
      {programMetadata.trackedEntityAttributes.filter( 
        ({id}) => !Object.values(formMapping.attributes).find( tea => tea === id ) 
      ).map( tea => populateInputField(tea.id) )}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    metadata: state.metadata,
    data: state.data,
  };
};
const mapDispatchToProps = {
  mutateTei,
  mutateAttribute,
  mutateEnrollment,
  mutateEvent,
};

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
