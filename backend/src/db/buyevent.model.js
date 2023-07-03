module.exports = (mongoose) => {
    const Buyevent = mongoose.model(
        "Buyevent",
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
                tokenaddress : {
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
                minbuy: {
                    type: Number,
                    default: 0
                },
                pooladdress: {
                    type: String,
                    default: ""
                },
                buyerwallet: {
                   type: String,
                   default: ""
                },
                amount: {
                    type: Number,
                    default: 0
                },
                txhash: {
                    type: String,
                    default: ""
                },
                isreaded: {
                    type: Boolean,
                    default: false
                }
            },
            { timestamps: true }
        )
    );
    return Buyevent;
};
