module.exports = (mongoose) => {
    const Winner = mongoose.model(
        "Winner",
        mongoose.Schema(
            {
                groupid: {
                    type: String,
                    default: ""
                },
                chainid: {
                    type: String,
                    default: ""
                },
                tokenaddress: {
                   type: String,
                   default: ""
                },
                tokendecimals: {
                    type: Number,
                    default: 0
                },
                alttokenaddress: {
                    type: String,
                    default: ""
                },
                alttokendecimals: {
                    type: Number,
                    default: 0
                },
                wonwallet : {
                    type: String,
                    default : ""
                },
                wonamount: {
                    type: Number,
                    default: 0
                },
                paymentWalletKey: {
                    type: String,
                    default: ""
                },
                paid_tx: {
                    type: String,
                    default: ""
                },
                isPaid: {
                    type: Boolean,
                    default: false
                },
                isRead: {
                    type: Boolean,
                    default: false
                },
                eventHash: {
                    type: String,
                    default: ""
                }
            },
            { timestamps: true }
        )
    );
    return Winner;
};
