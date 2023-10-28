import { MongoClient, ServerApiVersion } from 'mongodb';

export const handler = async (event) => {
    const payload = JSON.parse(event.body);
    try{
        const uri = "mongodb+srv://beodwilson:KR4wiDfW9b4aufzK@voicegpt.tjkpcx1.mongodb.net/?retryWrites=true&w=majority";
        // Create a MongoClient with a MongoClientOptions object to set the Stable API version
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        await client.connect()
        const database = client.db("voicegpt")
        const regularsurveys = database.collection(("regularsurveys"))
        //Survey structure
        // {
        //  mandatory ==> oauthCode:"",
        //   optional ==> questions: [
        //     {question:"", rating: 0},
        //     {question:"", rating: 0},
        //   ],
        //  optional ==> additionalThoughts: "blah",
        //  optional ==> furtherFeedBack: "blah"
        // };

        const surveyRecord = await regularsurveys.findOne({oauthCode: payload.oauthCode})
        if(!surveyRecord){
            await regularsurveys.insertOne({...payload})
        }
        else if(payload.registrationEmail){
            await regularsurveys.updateOne(
                    {oauthCode: surveyRecord.oauthCode},
                    {
                        "$set":
                            {
                                ...surveyRecord, 
                                registrationEmail: payload.registrationEmail
                            }
                    }
                )
        }
       // User is submitting further feedback after already submitting
       else if(payload.furtherAdditionalThoughts){
        if(surveyRecord.furtherAdditionalThoughts){
                await regularsurveys.updateOne(
                    {oauthCode: surveyRecord.oauthCode},
                    {
                        "$set":
                            {
                                ...surveyRecord, 
                                furtherAdditionalThoughts:
                                [
                                    ...surveyRecord.furtherAdditionalThoughts,
                                    payload.furtherAdditionalThoughts
                                ]
                            }
                    }
                )
        }
        else{ 
                  await regularsurveys.updateOne(
                    {oauthCode: surveyRecord.oauthCode},
                    {
                        "$set":
                            {
                                ...surveyRecord, 
                                furtherAdditionalThoughts:
                                [
                                    payload.furtherAdditionalThoughts
                                ]
                            }
                    }
                )
            }   
        }
        else {
            return {status:400, error:"User has already filled out this survey."}
        }
        client.close()
        return {status:200}
    }
    catch(exception) {
        return {status:500, error:exception.message}
    }
};
