const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
   user: process.env.EMAIL_USER,
   pass: process.env.EMAIL_PASSWORD
 }
});


const sendEmail = async (to, subject, html) => {
 try {
   const mailOptions = {
     from: process.env.EMAIL_USER,
     to,
     subject,
     html
   };
   const result = await transporter.sendMail(mailOptions);
   return { success: true, messageId: result.messageId };
 } catch (error) {
   return { success: false, error: error.message };
 }
};


const sendProgressAlertEmail = async (user, alertData) => {
 const subject = `FitSync Alert: ${alertData.title}`;
 const html = `
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
     <h2 style="color: #333;">${alertData.title}</h2>
     <p style="color: #666; line-height:1.6;">${alertData.message}</p>
     <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin:20px 0;">
       <h3 style="color: #333; margin-top:0;">Quick Actions:</h3>
       <ul style="color: #666;">
         <li>Log your meals and workouts</li>
         <li>Check your progress dashboard</li>
         <li>Adjust your plan if needed</li>
       </ul>
     </div>
     <p style="color: #999; font-size: 12px;">Stay on track with FitSync!</p>
   </div>
 `;
 return await sendEmail(user.email, subject, html);
};


const sendInactivityEmail = async (user, daysInactive) => {
 const subject = `FitSync: We Miss You!`;
 const html = `
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
     <h2 style="color: #333;">Hey ${user.firstName || 'there'}!</h2>
     <p style="color: #666; line-height: 1.6;">We noticed you haven't logged any activities for ${daysInactive} days. Don't let your fitness goals slip away!</p>
     <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin:20px 0;">
       <h3 style="color: #333; margin-top: 0;">Get Back on Track:</h3>
       <ul style="color: #666;">
         <li>Log today's meals and workouts</li>
         <li>Check your progress dashboard</li>
         <li>Generate a new plan if needed</li>
       </ul>
     </div>
     <p style="color: #999; font-size: 12px;">Your fitness journey continues with FitSync!</p>
   </div>
 `;
 return await sendEmail(user.email, subject, html);
};


module.exports = {
 sendEmail,
 sendProgressAlertEmail,
 sendInactivityEmail
};

